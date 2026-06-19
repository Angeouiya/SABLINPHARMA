const baseUrl = process.env.SABLIN_BASE_URL ?? "http://localhost:3001";

async function json(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.text();
  let data = null;
  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    data = body;
  }
  return { response, data };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasProp(value, prop) {
  return Object.prototype.hasOwnProperty.call(value ?? {}, prop);
}

function assertNoApparentPhone(value, label) {
  const digits = String(value ?? "").replace(/\D/g, "");
  assert(digits.length < 6, `${label} appears to expose a phone number: ${value}`);
}

async function run() {
  const medsResult = await json("/api/medications?limit=1");
  assert(medsResult.response.ok, "/api/medications failed");
  const med = medsResult.data?.[0];
  assert(med, "No medication returned for gate verification");
  assert(!hasProp(med, "pharmacyCount"), "/api/medications exposes pharmacyCount");
  assert(med.availabilityLocked === true, "/api/medications does not mark availability as locked");

  const medDetailResult = await json(`/api/medications/${med.slug}`);
  assert(medDetailResult.response.ok, "/api/medications/[slug] failed");
  const medDetail = medDetailResult.data;
  assert(Array.isArray(medDetail.pharmacies), "Medication detail pharmacies is not an array");
  assert(medDetail.pharmacies.length === 0, "Medication detail exposes pharmacies before unlock");
  assert(medDetail.pharmaciesAccess?.locked === true, "Medication detail missing locked pharmacies access");

  const pharmaciesResult = await json("/api/pharmacies");
  assert(pharmaciesResult.response.ok, "/api/pharmacies failed");
  const pharmacy = pharmaciesResult.data?.[0];
  assert(pharmacy, "No pharmacy returned for gate verification");
  assert(!hasProp(pharmacy, "medicationCount"), "/api/pharmacies exposes medicationCount");
  assertNoApparentPhone(pharmacy.phone, "/api/pharmacies phone");

  const pharmacyDetailResult = await json(`/api/pharmacies/${pharmacy.slug}`);
  assert(pharmacyDetailResult.response.ok, "/api/pharmacies/[slug] failed");
  const pharmacyDetail = pharmacyDetailResult.data;
  assert(Array.isArray(pharmacyDetail.medications), "Pharmacy detail medications is not an array");
  assert(pharmacyDetail.medications.length === 0, "Pharmacy detail exposes inventory before unlock");
  assert(pharmacyDetail.inventoryAccess?.locked === true, "Pharmacy detail missing locked inventory access");
  assertNoApparentPhone(pharmacyDetail.phone, "/api/pharmacies/[slug] phone");

  const contactResult = await json(`/api/pharmacies/${pharmacy.slug}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "phone" }),
  });
  assert(contactResult.response.status === 401, "Contact unlock without a session should return 401");

  console.log("OK public credit gates: public medication, pharmacy, inventory and contact data are locked.");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
