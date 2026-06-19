type ImageForPublication = {
  imageType: string;
  validationStatus: string;
  licenseType: string;
  commercialUseAllowed: boolean;
};

export function canPublishMedicationImage(image: ImageForPublication) {
  const isWebCandidate = image.imageType === "web_candidate";
  if (!isWebCandidate) return { allowed: true, reason: null };

  const license = image.licenseType.toLowerCase();
  const licenseBlocked =
    license.includes("inconnue") ||
    license.includes("à confirmer") ||
    license.includes("a confirmer") ||
    license.includes("usage interdit");
  const validationOk = image.validationStatus === "Validée" || image.validationStatus === "Publiée";

  if (!validationOk) {
    return {
      allowed: false,
      reason: "Image web non validée. Validez la correspondance et la licence avant publication.",
    };
  }

  if (!image.commercialUseAllowed || licenseBlocked) {
    return {
      allowed: false,
      reason: "Licence image non publiable. Utilisez une image validée, une image pharmacie ou le placeholder SABLIN PHARMA.",
    };
  }

  return { allowed: true, reason: null };
}

