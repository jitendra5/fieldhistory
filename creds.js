/*const credentials = {
    loginUrl: 'https://audit2023-dev-ed.develop.my.salesforce.com', // Use for sandbox, change to 'login.salesforce.com' for production
    username: 'jitendra.audit2023@gmail.com',
    password: 'Audit@2024Dz37x8IoKDHin8XCYzcy7zUP'
};*/
const credentials = {
    loginUrl: 'https://audit2023-dev-ed.develop.my.salesforce.com', // Use for sandbox, change to 'login.salesforce.com' for production
    username: 'jitendra.audit2023@gmail.com',
    password: 'Audit@2024Dz37x8IoKDHin8XCYzcy7zUP',
    clientId:'3MVG9ZUGg10Hh224lHMMYUSxknoofYZWGYcv8JBhVwNOzIDu0qtmwoLd1N0FTzTLxzspS0bhO0g4If_CPitng',
    clientSecret:'0F7534C34426C09A578529C246F2643D010DD7047EA3C1915087DD88A4FCEB65',
    instanceUrl: 'https://cereblis--partialsb.sandbox.my.salesforce.com'
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