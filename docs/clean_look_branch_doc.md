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

# Configuration of colors

The different colors that can be configured are the following :
* background color (CPBGBODY, CPDARKBGBODY),
* background color of app list on the home page (on the right/center), it is also used for about modal window background (CPBGALERT, CPDARKBGALERT),
* brand color (used on the home page for the text under the logo) (CPBRANDCOLOR, CPDARKBRANDCOLOR),
* text color (used as the text in the sub text in the home page, the text of the navigation button, ...) (CPTEXTCOLOR, CPDARKTEXTCOLOR),
* background color of navigation buttons (CPNAVBGCOLOR, CPDARKNAVBGCOLOR).

Between parenthesis, you have the name of the corresponding environment variables. An example of a .env file is the following :

    # System configuration
    CPHTTPUNSAFEORIGIN="http://localhost:8082"
    CPHTTPPORT=8082
    CPLOGTOSTDOUT="true"
    CPADMIN1="[laparn@localhost:8082/Cd6bwTvMZRtBK4PpmrMk116upbvc6lBm+flehErLf3U=]"
    
    # Light theme configuration
    CPBGBODY="#FFF0FF"
    CPBGALERT="#F0F0FF"
    CPBRANDCOLOR="#F78D1E"
    CPTEXTCOLOR="#430047"
    CPNAVBGCOLOR="#FFF"
    
    # Dark theme configuration
    CPDARKBGBODY="#210021"
    CPDARKBGALERT="#111111C0"
    CPDARKBRANDCOLOR="#F78D1E"
    CPDARKTEXTCOLOR="#FFF0DC"
    CPDARKNAVBGCOLOR="#F78D1E"

# Configuration of background

It is also possible to configure 2 background images, one for the light theme and one for the dark theme. 

To display the image as background, the environment variable CPSHOWBGIMAGE should be set to "yes". The image can be put in the directory cryptpad/customize.dist/images/background. The urls should be put in the environment variables CPBGIMAGE (light theme) and CPDARKBGIMAGE (dark theme).

    CPSHOWBGIMAGE="true"
    CPBGIMAGE="/customize/images/background/bg.jpg"
    CPDARKBGIMAGE="/customize/images/background/bg-dark.jpg"

As for all background images, they should be heavily compressed. I use pictures with a size of 1920x1280. Either svg or jpeg are mandatory. A maximal size of 300kB should be used, the smaller, the better.

With just CPSHOWIMAGE to "true", the default images in 
customize.dist/images/background/bg.jpg and customize.dist/images/background/bg-dark.jpg will be used.