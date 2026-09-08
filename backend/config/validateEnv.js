const validateEnv = () => {

    const requiredVariables = [
        "DB_HOST",
        "DB_USER",
        "DB_PASSWORD",
        "DB_NAME",
        "JWT_SECRET",
        "USDA_API_KEY"
    ];


    const missingVariables =
        requiredVariables.filter(
            (variable) =>
                !process
                    .env[
                        variable
                    ] ||
                !process
                    .env[
                        variable
                    ]
                    .trim()
        );


    if (
        missingVariables.length >
        0
    ) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        );
    }
};


module.exports =
    validateEnv;
