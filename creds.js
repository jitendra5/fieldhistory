const credentials = {
    loginUrl: 'https://audit2023-dev-ed.develop.my.salesforce.com', // Use for sandbox, change to 'login.salesforce.com' for production
    username: 'jitendra.audit2023@gmail.com',
    password: 'Audit@2024Dz37x8IoKDHin8XCYzcy7zUP'
};

const deploymentConfig = {
    testLevel: 'RunSpecifiedTests',    // This is required for production deployments
    checkOnly: false,              // Set to true to validate the deployment without deploying
    ignoreWarnings: true,          // Ignore warnings in deployment
    rollbackOnError: true,         // Roll back deployment if an error occurs
    singlePackage: true,            // Consider everything as a single package
    runTests: ''
};
module.exports={
    credentials,
    deploymentConfig
  }