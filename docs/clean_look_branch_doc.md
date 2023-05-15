# Configuration through .env or env variables 

## Configuration for the back-end
In its original version, configuration variables are either in config/config.js (copied from the config/config.example.js), or in the application_configuration in the customize or customize.dist directory.

If you look at 12factor.net, you will see that this does not look like as a good way to configure a Saas application as you must have a "strict separation of config from code". At least, it means that, when upgrading, you need to take a look at the new configuration file and at yours and to do a fusion. It is exactly the same for customize directory, when upgrading, you may end up with problems identifying what you did, and how you have to change the file to take into account your change.

Then, putting your whole configuration elsewhere, in a static file, not linked to your code, is much better. What is adviced by the twelve-factor app is to store the configuration in environment variables.

That's what we have done (partly) in this version of Cryptpad in using the dotenv package.

This can be seen in the config/config.js provided file. Then you can have a .env file in the directory where you start npm run start or npm run dev, which variables will be used or you can use plain environment variables.

A typical file .env file is :

	CPHTTPUNSAFEORIGIN="http://localhost:8080"
	CPHTTPPORT=8080
	CPLOGTOSTDOUT="true"
	CPADMIN1="[laparn@localhost:8080/75e2-Z9K-A4EohWnLgYJo5ReOfWqNH+edX+AjNOxyEo=]"

So for any variable that may be provided by config.js, you may provide an environment variable which name will be :
CP followed by the name of the variable in capital. i.e. : httpUnsafeOrigin => CPHTTPUNSAFEORIGIN

The list of the variables is available in config.js. For most of them, default values are available, so without .env file, the program will start with standard configuration.

## Why was it made ?

The idea is to ease the configuration, and to allow an easier packaging of the application.

## What it means for a programmer

Well it changes nothing, the values are stored in the Config object and that's all. They may come from the defaults defined in config.js or they may be defined in .env. No difference.

## What about the administrators configuration

Administrators are put in an array in config.js, then we use CPADMIN1, CPADMIN2, .... to configure the different administrators.

