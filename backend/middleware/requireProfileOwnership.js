const profileService = require("../services/profileService");
const { isValidId } = require("../utils/numberUtils");

async function requireProfileOwnership(req, res, next) {
  try {
    const profileId = Number(req.params.profileId);
    if (!isValidId(profileId)) return res.status(400).json({ error: "Invalid profile ID" });
    const profile = await profileService.getProfileById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    if (Number(profile.user_id) !== Number(req.user?.userId)) {
      return res.status(403).json({ error: "You are not allowed to access this profile" });
    }
    req.ownedProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireProfileOwnership;
