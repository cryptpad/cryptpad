# Journal of development of Arnaud Laprévote

## Summary

* Configuration of main colors
* Configuration of the logos
* Configuration of look and suppression of customize
* Configuration of background

## Configuraiton of main colors
### Adding a configuration for an element

#### Configuration for the back-end
In its original version, configuration variables are either in config/config.js (copied from the example), or in the application_configuration in the customize or customize.dist directory.

If you look at 12factor.net, you will see that this does not look like as a good way to configure a Saas application as you must have a "strict separation of config from code". At least, it means that, when upgrading, you need to take a look at the new configuration file and at yours and to do a fusion. It is exactly the same for customize directory, when upgrading, you may end up with problems identifying what you did, and how you have to change the file to take into account your change.

Then, putting your whole configuration elsewhere, in a static file, not linked to your code, is much better. What is adviced by the twelve-factor app is to store the configuration in environment variables.

That's what we have done (partly) in this version of Cryptpad in using the dotenv package.

This can be seen in the config/config.js provided file. Then you can have a .env file in the directory where you start npm run start or npm run dev, which variables will be used.

A typical file .env file is :

	CPHTTPUNSAFEORIGIN="http://localhost:8082"
	CPHTTPPORT=8082
	CPLOGTOSTDOUT="true"
	CPADMIN1="[laparn@localhost:8082/Cd6bwTvMZRtBK4PpmrMk116upbvc6lBm+flehErLf3U=]"
V	CPLOGOPATH="/home/alaprevo/Source/cryptpad/cryptpad/customize/XWiki-logo-only-x-color.svg"
	CPGREYLOGOPATH="/home/alaprevo/Source/cryptpad/cryptpad/customize/XWiki-logo-only-x-grey.svg"
	CPFAVICONPATH="/home/alaprevo/Source/cryptpad/cryptpad/customize/XWiki-logo-only-x-color.png"
	CPBGBODY="#FFFFFF"
	CPBGALERT="#F2F8FF80"
	CPCOLORBRAND="#F78D1E"
	CPTEXTCOLOR="#434447"
	CPDARKTHEMEBGBODY="#000000"
	CPDARKTHEMEBGALERT="#111111C0"
	CPDARKTHEMECOLORBRAND="#F78D1E"
	CPDARKTHEMETEXTCOLOR="#F78D1E"
	CPNAVBUTTONBGCOLOR="#7fb6d7b5"
	CPDARKNAVBUTTONBGCOLOR="#802020C0"
	CPSHOWBGIMAGE="true"
	CPBGIMAGE="/customize/images/background/bg.jpg"
	CPDARKBGIMAGE="/customize/images/background/bg-dark.jpg"
	CPLOOKDIR="bg"

So for any variable that may be provided by config.js, you may provide an environment variable which name will be :
CP followed by the name of the variable in capital. i.e. : httpUnsafeOrigin => CPHTTPUNSAFEORIGIN

The list of the variables is available in config.js. For most of them, default values are available, so without .env file, the program will start with standard configuration.

#### Why was it made ?

The idea is to ease the configuration, and to allow an easier packaging of the application.

Then it was used in order to ease the graphical configuration of the application. First in allowing the configuration of the main logos of the application (favicon, central icon in user home page, grey logo), and then the configuration of the different main colors of the application. After that, I used it to change the global look and to introduce background image.

#### What it means for a programmer

Well it changes nothing, the values are stored in the Config object and that's all. They may come from the defaults defined in config.js or they may be defined in .env. No difference.

#### Adding a variable for a color

There is something specific with colors. They must be known from the client, but we have defined them on the server. So they must be transmitted to the client.

It works the following way :
* First, we define it in the config.js file in the following way.
* we define the variable with a default value in the first module.exports definition. For example : 

    bgBody: "#eeeeee";

* then we put the variable in the list of available variables :
    const varArray =[ "httpUnsafeOrigin", "httpSafeOrigin","httpAddress", "httpPort", "httpSafePort",
    "maxWorkers", "adminKeys", "inactiveTime", "archiveRetentionTime", "accountRetentionTime",
    "disableIntegratedEviction", "maxUploadSize","premiumUploadSize", "filePath",
    "archivePath", "pinPath", "taskPath", "blockPath", "blobPath", "blobStagingPath",
    "decreePath", "logPath", "logToStdout", "logLevel", "logFeedback", "verbose",
    "installMethod", "logoPath", "greyLogoPath", "favIconPath", "bgBody", "bgAlert", "colorBrand", "textColor" ];

* if it is a number or a boolean variable, you should put it in numberVarArray or booleanVarArray.

* the variable must be put in the Env variable. This is done in lib/env.js

    const Env = {
        ...
        bgBody: config.bgBody,
        bgAlert: config.bgAlert,
        colorBrand: config.colorBrand,
        textColor: config.textColor,
        ...
    } 

* Now the variable needs to be put at disposal for the client. This is done in server.js where you put the set of configuration variable that are available for the client. 
    var serveConfig = makeRouteCache(function () {
        return [
            'define(function(){',
            'return ' + JSON.stringify({
                requireConf: {
                    waitSeconds: 600,
                    urlArgs: 'ver=' + Env.version + cacheString(),
                },
                removeDonateButton: (Env.removeDonateButton === true),
                allowSubscriptions: (Env.allowSubscriptions === true),
                websocketPath: Env.websocketPath,
                httpUnsafeOrigin: Env.httpUnsafeOrigin,
                adminEmail: Env.adminEmail,
                adminKeys: Env.admins,
                inactiveTime: Env.inactiveTime,
                supportMailbox: Env.supportMailbox,
                defaultStorageLimit: Env.defaultStorageLimit,
                maxUploadSize: Env.maxUploadSize,
                premiumUploadSize: Env.premiumUploadSize,
                restrictRegistration: Env.restrictRegistration,
                httpSafeOrigin: Env.httpSafeOrigin,
                enableEmbedding: Env.enableEmbedding,
                fileHost: Env.fileHost,
                shouldUpdateNode: Env.shouldUpdateNode || undefined,
                listMyInstance: Env.listMyInstance,
                bgBody: Env.bgBody,
                bgAlert:Env.bgAlert,
                colorBrand:Env.colorBrand,
                textColor:Env.textColor,
                accounts_api: Env.accounts_api,
            }, null, '\t'),
            '});'
        ].join(';\n');
    }, 'configCache');

* finally, there is a trick to have the variable available in the less environment. We create the variable in the string on which the less renderer is started. This is done in www/common/LessLoader.js . Just add the variable to the showConfigVariableArray .

    var loadLess = function (url, cb) {
        getLessEngine(function (less) {
            /* There should be 2 ways to do depending of the customization */
            /* I should create a set of default variable (basically the color theme) */
            /* which is then used in the theme */
            /* So the full colortheme could be directly in the configuration */
            console.log("LessLoader.js - getLessEngine - Config : ",Config);
            var showConfigVariableArray = ["bgBody", "bgAlert", "colorBrand", "textColor", "darkThemeBgBody",
                                       "darkThemeBgAlert", "darkThemeColorBrand", "darkThemeTextColor",
                                       "showBgImage", "bgImage", "darkBgImage", 'navButtonBgColor', 'darkNavButtonBgColor'];
            
            var lessVariableArray = [];
            var lessStringHeader = "";
            for ( var i = 0; i < showConfigVariableArray.length; i++) {
                var currentVar = showConfigVariableArray[i];
                var value = currentVar.replace(/([A-Z])/g,"-$1");
                lessVariableArray.push("cp-config-"+value.toLowerCase());
                lessStringHeader += `@cp-config-${value.toLowerCase()}: ${Config[currentVar]};
`;
                console.log("LessLoader.js - "+showConfigVariableArray[i] + " : ", Config[currentVar]);
            }
            lessStringHeader +=`@import (multiple) "${url}" ;`
            console.log("LessLoader.js - lessStringHeader : ",lessStringHeader);
            less.render(lessStringHeader, {}, function(err, css) {
                if (err) { return void cb(err); }
                cb(undefined, css.css);
            }, window.less);
        });
    };

 * I propose to use the following convention : the variable is prefixed with cp-config (cryptpad-config) and followed by the "decamelized" version of the variable with only - . bgBody => cp-config-bg-body .

 * Now it is possible to use the variables in the colortheme.less file. For example, you can find there : 

    @cryptpad_color_brand: @cp-config-color-brand;

Next steps : switch to the graphical configuration for the colors or otheer graphical options, allow to upload files for the logos.

## Configuration of the logos

You can change the path of the logos in changing the following environment variables : 

	CPLOGOPATH="/home/alaprevo/Source/cryptpad/cryptpad/customize/XWiki-logo-only-x-color.svg"
	CPGREYLOGOPATH="/home/alaprevo/Source/cryptpad/cryptpad/customize/XWiki-logo-only-x-grey.svg"
	CPFAVICONPATH="/home/alaprevo/Source/cryptpad/cryptpad/customize/XWiki-logo-only-x-color.png"

The 3 logos are : CPLOGOPATH, the logo of the theme (used for example in the home page), CPGREYLOGOPATH, the logo in grey version, and finally CPFAVICONPATH, the favicon of the application.

To do that, 4 new routes where created : 

/look/cplogo : the cryptpad logo
/look/logo : the current logo 
/look/greylogo : the grey version
/look/favicon : the favicon

In server.js, the corresponding routes are created. Either the default file (in customize.dist) is used or the one indicated by the environment variable.

## Look configuration

### Current status

It is possible to customize deeply the different page of Cryptpad. You do that in adding a customize directory  and copying and modifying all the files of the customize.dist directory.

In the nginx configuration, if there is a file in customize it is used, else it is the file in customize.dist that is used.

    location ^~ /customize/ {
        rewrite ^/customize/(.*)$ $1 break;
        try_files /customize/$uri /customize.dist/$uri;
    }

### Proposal

I propose a very small change to that. The only difference is that the configuration should be stored in a subdirectory of customize.dist. Then, through an environment variable (CPLOOKDIR) or config.js lookDir variable it is possible to choose this directory.

So today, you put in customize your customization. What I propose is you create in customize.dist a subdirectory mylook, configure CPLOOKDIR "mylook" and that's all. It changes nothing. The current content of customize.dist is just put in the subdirectory default.

But it allows to create different looks and to switch easily between them. And customize is no more necessary. So the configuration of nginx can be simplified.

In the server.js file, when an url in customize or customize.dist is called, the content of customize.dist/${LOOKDIR} is used.

## Background configuration

As an example of use, I created a  "bg" directory. It is very close to default, but display a background image. The configuration is done through the variables showBgImage, bgImage and darkBgImage in config.js or the environment variables CPSHOWBGIMAGE, CPBGIMAGE, CPDARKBGIMAGE. 

showBgImage should be true to allow the display of the background image (else false), bgImage and darkBgImage hold the path of the files used as background. The files may be png, jpeg/jpg or svg files. It is very adviced to use jpeg images with high compression (typically 30kB).
