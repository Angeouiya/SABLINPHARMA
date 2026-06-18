import assert from "node:assert/strict";

const {
  canAccessFeature,
  FCFA_PER_CREDIT,
  PASS_ORDONNANCE_PRICE,
  CREDIT_PACKS,
} = await import("../src/lib/restrictions.ts");

assert.equal(FCFA_PER_CREDIT, 100);
assert.equal(PASS_ORDONNANCE_PRICE, 500);
assert.deepEqual(
  CREDIT_PACKS.map((pack) => [pack.amount, pack.credits]),
  [
    [200, 2],
    [500, 6],
    [1000, 13],
    [2000, 28],
  ]
);

assert.equal(canAccessFeature({ credits: 0 }, "searchMedication").allowed, true);
assert.equal(canAccessFeature({ credits: 0 }, "seePharmacyContact").allowed, false);
assert.equal(canAccessFeature({ credits: 1 }, "seePharmacyContact").allowed, true);
assert.equal(canAccessFeature({ credits: 1 }, "estimatePrescription").allowed, false);
assert.equal(canAccessFeature({ credits: 2 }, "estimatePrescription").allowed, true);
assert.equal(
  canAccessFeature({ credits: 0, hasPass: true, passStatus: "active" }, "estimatePrescription").allowed,
  true
);
assert.equal(
  canAccessFeature({ credits: 0, hasPass: true, passStatus: "expired" }, "estimatePrescription").allowed,
  false
);
assert.equal(canAccessFeature({ credits: 0 }, "callPharmacy").allowed, false);
assert.equal(canAccessFeature({ credits: 4 }, "confirmFull").allowed, true);

console.log("Restriction checks passed");
