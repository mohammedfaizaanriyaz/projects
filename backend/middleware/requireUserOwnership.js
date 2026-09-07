const requireUserOwnership = (
    req,
    res,
    next
) => {

    const requestedUserId =
        Number(
            req.params.userId
        );

    const authenticatedUserId =
        Number(
            req.user?.userId
        );

    if (
        !Number.isInteger(
            requestedUserId
        ) ||
        requestedUserId <= 0
    ) {
        return res
            .status(400)
            .json({
                error:
                    "Invalid user ID"
            });
    }

    if (
        requestedUserId !==
        authenticatedUserId
    ) {
        return res
            .status(403)
            .json({
                error:
                    "You are not allowed to access this user's data"
            });
    }

    next();
};

module.exports =
    requireUserOwnership;