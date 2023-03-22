
define([], function () {
    var Condorcet = {};

    // Creates every possible combination pair of given options
    var getPermutations = function(array, size) {

        var result = [];

        function p(t, i) {
            if (t.length === size) {
                result.push(t);
                result.push(t.slice().reverse());
                return;
            }
            if (i >= array.length) {
                return;
            }
            p(t.concat(array[i]), i + 1);
            p(t, i + 1);
        }

        p([], 0);
        return result;
    };

    Condorcet.showCondorcetWinner = function(_answers, opts, uid, form, optionArray, listOfLists) {

        var comparePairs = function() {
            var pairs = getPermutations(optionArray, 2);
            
            var pairDict = {};
            pairs.forEach(function (pair) {                        
                pairDict[pair] = 0;
                listOfLists.forEach(function(optionList) {
                    if (optionList.indexOf(pair[0]) < optionList.indexOf(pair[1])) {
                        pairDict[pair] ++;
                    }
                });
            });
            
            var pathDictionary = {};
            //Adds winner of each pairwise comparison to path
            optionArray.forEach(function(option1) {
                optionArray.forEach(function(option2){
                    if (option1 !== option2) {
                        var key1 = [option1, option2].join();
                        var key2 = [option2, option1].join();
                        if (pairDict[key1] > pairDict[key2]) {
                            pathDictionary[key1] = pairDict[key1]; 
                        } else if (pairDict[key2] > pairDict[key1]) {
                            pathDictionary[key2] = pairDict[key2];
                        }
                    }
                });
            });
            return pathDictionary;
        };
    
        var schulzeMethod = function(optionArray) {
    
            var findWeakestPath = function(optionArray) {
                var pathDictionary = comparePairs(optionArray);
    
                //Iterates through paths between two options comparing the weakest edge to current score
                optionArray.forEach(function(option1) {
                    optionArray.forEach(function(option2) {
                        if (option1 !== option2) {
                            optionArray.forEach(function(option3){
                                if (option1 !== option3 && option2 !== option3) {
                                    var key1 = [option2, option3].join();
                                    var key2 = [option2, option1].join();
                                    var key3 = [option1, option3].join();
                                    var score;
                                    if (pathDictionary[key1] === undefined) {
                                        score = 0;
                                    } else {
                                        score = pathDictionary[key1];
                                    }
                                    var path1;
                                    if (pathDictionary[key2] !== undefined) {
                                        path1 = pathDictionary[key2]; 
                                    } else {
                                        path1 = 0;
                                    }
                                    var path2;
                                    if (pathDictionary[key3]) {
                                        path2 = pathDictionary[key3]; 
                                    } else {
                                        path2 = 0;
                                    }
                                    var weakestPath = Math.min(path1, path2);
                                    if (weakestPath > score) {
                                        pathDictionary[key1] = weakestPath;
                                    }
                                }
                            });
                        }
                    });
                });
                return pathDictionary;
            };
    
            var calculateWinner = function() {
    
                var pathDictionary = findWeakestPath(optionArray);
                //Calculate scores for each option and select winner
                var winningMatches = {};
                optionArray.forEach(function(option){
                    winningMatches[option] = 0;
                });
                Object.keys(pathDictionary).forEach(function(pair) {
                    var option1 = pair.split(',')[0];
                    winningMatches[option1] ++;
                });
                
                var rankedResults = {};
                Object.keys(winningMatches).forEach(function(option) {
                if (Object.keys(rankedResults).includes(winningMatches[option].toString())) {
                    rankedResults[winningMatches[option]].push(option);
                } else {
                    rankedResults[winningMatches[option]] = [option];
                }
                });
                return [rankedResults, winningMatches];
            };
            return(calculateWinner());
        };
    
        var rankedPairsMethod = function (optionArray, listOfLists, _answers) {

            var pairs = getPermutations(optionArray, 2);
            
            var lockPairs = function() {
                //'Locks' pairwise comparisons which do not create a beatpath cycle
                var pathDictionary = comparePairs(listOfLists, pairs);
    
                var items = Object.keys(pathDictionary).map(function(key) {
                    return [key, pathDictionary[key]];
                });
                
                items.sort(function(first, second) {
                    return second[1] - first[1];
                });
                
                var list = [items[0][0]];
                var list2 = [];
                items.forEach(function(item){
                    opts = item[0].split(',');
                    if (!list2.includes(opts[0])) {
                        list2.push(opts[1]);
                        if (!list.includes(item[0])) {
                            list.push(item[0]);
                        }
                    } 
                });

                return list;
    
            };
    
            var rankPairs = function(optionArray, listOfLists, _answers) {
                //Ranks locked pairs
                var list = lockPairs(optionArray, listOfLists, _answers);
    
                var rankDict = {};
                optionArray.forEach(function(o){
                    rankDict[o] = 0;
                    list.forEach(function(pair) {
                        if (o === pair.split(',')[1]) {
                            rankDict[o] --;
                        } else if (o === pair.split(',')[0]) {
                            rankDict[o] ++;
                        }  
                    });
                });
        
                var rankedItems = Object.keys(rankDict).map(function(key) {
                    return [key, rankDict[key]];
                });
                
                rankedItems.sort(function(first, second) {
                    return second[1] - first[1];
                });
    
                var finalRank = [];
                rankedItems.forEach(function(i){
                    finalRank.push(i[0]);
                });
                var sortedRankDict = {};
                finalRank.forEach(function(opt){
                    sortedRankDict[opt] = rankDict[opt];
                });

                return [finalRank, sortedRankDict];
            };

            var condorcetWinner = rankPairs(optionArray, listOfLists, _answers);
            return condorcetWinner;
        };
    
        var pickMethod = function(optionArray, listOfLists, _answers, uid){
            var condorcetWinner = [];
            var schulzeWinner = schulzeMethod(optionArray, listOfLists, _answers, uid);
            var rankedPairWinner = rankedPairsMethod(optionArray, listOfLists);
            var method = form[uid].condorcet["method"];
            if (method === "schulze") {
                condorcetWinner[0] = schulzeWinner;
                condorcetWinner[1] = rankedPairWinner;
            } else if (method === "ranked") {
                condorcetWinner[0] = rankedPairWinner;
                condorcetWinner[1] = schulzeWinner;
            }
            return condorcetWinner;
        };
        return pickMethod(optionArray, listOfLists, _answers, uid);
    };

    return Condorcet;
});

