var kad=require("kad");
var levelup=require("levelup");

/*
    THiS FILE IS NOT PRODUCTION READY
    DON'T USE IT!
*/

module.exports.create=function(conf,cb){
    var dht= kad({
        address:conf.kadAddress,
        port:conf.kadPort,
        storage:levelup(conf.kadStore),
        seeds:conf.kadSeeds,
        transport: kad.transports.UDP,
    });

    var getIndex=function(cName,f){
        dht.get(cName+'=>index',function(e,out){
            e && console.error(e) || f(Number(out));
        });
    };

    cb({
        message:function(cName, content, cb){
            getIndex(cName, function(index){
                index+=1;
                dht.put(cName+'=>index', ''+index,function(e){
                    e && console.error("ERROR updating index (%s): %s",index,e) ||
                    console.log("PUT SUCCESS: %s", cName+'=>index')
                });
                dht.put(cName+'=>'+index, content, function(e){
                    e && console.error("ERROR updating value at %s: %s",cName+'=>'+index,e)||
                    console.log("PUT SUCCESS: %s", cName+'=>index')
                    cb();
                });
            });
        },
        getMessages: function(cName, cb){
            getIndex(cName, function(index){
                for(var i=index;i>=0;i--){
                    dht.get(cName+'=>'+i,function(e,out){
                        if(e) return console.error("DHT GET ERROR: %s",e);
                        console.log("GET SUCCESS: %s", cName+'=>index')
                        cb(out);
                    });
                }
            });
        },
    });
};
