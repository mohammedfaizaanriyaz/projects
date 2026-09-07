const profileService =
    require(
        "../services/profileService"
    );

const requireProfileOwnership =
    async (
        req,
        res,
        next
    ) => {
        try {

            const profileId =
                Number(
                    req.params.profileId
                );

            if (
                !Number.isInteger(
                    profileId
                ) ||
                profileId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Invalid profile ID"
                    });
            }

            const profile =
                await profileService
                    .getProfileById(
                        profileId
                    );

            if (!profile) {
                return res
                    .status(404)
                    .json({
                        error:
                            "Profile not found"
                    });
            }

            const profileOwnerId =
                Number(
                    profile.user_id
                );

            const loggedInUserId =
                Number(
                    req.user?.userId
                );

            if (
                profileOwnerId !==
                loggedInUserId
            ) {
                return res
                    .status(403)
                    .json({
                        error:
                            "You are not allowed to access this profile"
                    });
            }

            next();

        } catch (error) {
            next(error);
        }
    };

module.exports =
    requireProfileOwnership;