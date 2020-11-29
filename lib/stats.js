
const Fs = require('fs');
const nThen = require("nthen");
const Admin = require("./commands/admin-rpc");
const uuid = require("uuid");

module.exports.create = function (Env) {

  Env.Stats = {
    stats : {},

    getStats: function() {
      return stats;
    },

    getRegisteredUsers : function (Env, cb) {
      return Env.batchRegisteredUsers('', cb, function (done) {
        var dir = Env.paths.pin;
        var folders;
        var users = 0;
        nThen(function (waitFor) {
            Fs.readdir(dir, waitFor(function (err, list) {
                if (err) {
                    waitFor.abort();
                    return void done(err);
                }
                folders = list;
            }));
        }).nThen(function (waitFor) {
            folders.forEach(function (f) {
                var dir = Env.paths.pin + '/' + f;
                Fs.readdir(dir, waitFor(function (err, list) {
                    if (err) { return; }
                    users += list.length;
                }));
            });
        }).nThen(function () {
            done(users);
        });
      });
    },

    addRegisteredUser: function(Env) {
      this.stats.registeredUsers++;
      this.saveStats(Env);
    }, 
 
    addOpenPad: function(Env) {
      this.stats.openPadsSinceLastPing++;
      this.saveStats(Env);
    },

    addNewPad: function(Env) {
      this.stats.newPadsSinceLastPing++;
      this.saveStats(Env);
    }, 

    setMaxOpenWebSockets: function(nbOpenWebSockets) {
      if (nbOpenWebSockets > this.stats.maxOpenWebSockets) {
       this.stats.maxOpenWebSockets = nbOpenWebSockets
      }
    }, 
    
    setMaxOpenUniqueWebSockets: function(nbOpenUniqueWebSockets) {
      if (nbOpenUniqueWebSockets > this.stats.maxOpenUniqueWebSockets) {
       this.stats.maxOpenUniqueWebSockets = nbOpenUniqueWebSockets
      }
    }, 

    resetStats: function(Env) {
      this.stats.openPadsSinceLastPing = 0;
      this.stats.newPadsSinceLastPing = 0;
      this.stats.maxOpenWebSockets = 0;
      this.stats.maxOpenUniqueWebSockets = 0;
      this.saveStats(Env);
    },

    saveStats: function(Env) {
      this.updateStats(Env);
      var sstats = JSON.stringify(this.stats);
      console.log("DEBUG Writing stats ", sstats);
      Fs.writeFileSync('stats.json', sstats)
    },

    initStats: function(Env) {
      try {
       let sstats = Fs.readFileSync('stats.json');
       this.stats  = JSON.parse(sstats);
      } catch (e) {
       this.stats = { registeredUsers : 0, maxOpenWebSockets : 0, maxOpenUniqueWebSockets: 0,
                      openPadsSinceLastPing : 0, newPadsSinceLastPing : 0 }
       this.stats.uuid = uuid.v4();
       this.saveStats(Env);
      }

      this.getRegisteredUsers(Env, function(nbRegs) {
        console.log(nbRegs);
        Env.Stats.stats.registeredUsers = nbRegs;
        console.log("DEBUG Stats: ", Env.Stats.stats);
      });
    },

    updateStats: function(Env) {
      if (Env && Env.Server) {
        var sessionStats = Env.Server.getSessionStats();
        console.log("DEBUG: Current connections: ", sessionStats.total);
        console.log("DEBUG: Current unique connections: ", sessionStats.unique);
        this.setMaxOpenUniqueWebSockets(sessionStats.unique);
        this.setMaxOpenWebSockets(sessionStats.total);
      }
    }
  };

  Env.Stats.initStats(Env);
};
