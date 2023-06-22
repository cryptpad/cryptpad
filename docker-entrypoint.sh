#/bin/sh

## Required vars
# CPAD_MAIN_DOMAIN
# CPAD_SANDBOX_DOMAIN
# CPAD_ADMIN_EMAIL
# CPAD_CONF

set -e

CPAD_HOME="/cryptpad"

# If cryptad conf isn't provided
if [ ! -f "$CPAD_CONF" ]; then
 echo -e "\n\
         ############################################### \n\
         Warning: No config file provided for CryptPad \n\
         We will create a basic one for now but you should rerun this service \n\
         by providing a file with your settings \n\
         eg: docker run -v /path/to/config.js:/cryptpad/config/config.js \n\
         ############################################### \n"

   cp $CPAD_HOME/config/config.example.js $CPAD_CONF

   # Set domains
   sed -i  -e "s@\(httpUnsafeOrigin:\).*[^,]@\1 'https://$CPAD_MAIN_DOMAIN'@" \
           -e "s@\(^ *\).*\(httpSafeOrigin:\).*[^,]@\1\2 'https://$CPAD_SANDBOX_DOMAIN'@" $CPAD_CONF

   # Set admin email
   if [ -z "$CPAD_ADMIN_EMAIL" ]; then
     echo "Error: Missing admin email (Did you read the config?)"
     exit 1
   else
     sed -i "s@\(adminEmail:\).*[^,]@\1 '$CPAD_ADMIN_EMAIL'@" $CPAD_CONF
   fi
 fi

cd $CPAD_HOME
npm run build

exec "$@"
