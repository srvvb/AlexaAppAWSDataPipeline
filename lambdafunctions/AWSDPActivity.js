'use strict';

var AWS = require('aws-sdk');


//The status to be set on all the objects specified in objectIds. 
//For components, use PAUSE or RESUME. For instances, use TRY_CANCEL, RERUN, or MARK_FINISHED


function getDataPipelineStatus(pipelineId,datapipeline,pipelineName,pipelineAction,callback) {
                
    console.log('STATE-STATUS');
    var paramsPS = {
        pipelineIds: [ pipelineId ]
    };
    datapipeline.describePipelines(paramsPS, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(err);
        }
        else { 
            console.log(data);           // successful response
            var keyName = 'None';
            if (pipelineAction=="STATE") {
                keyName = "@pipelineState";
            } else {
                keyName = "@healthStatus";
            }
            var keyValue = 'None';
            for (var i in data.pipelineDescriptionList){
                for ( var j in data.pipelineDescriptionList[i].fields){
                    if (data.pipelineDescriptionList[i].fields[j].key == keyName) {
                        keyValue = data.pipelineDescriptionList[i].fields[j].stringValue;
                        console.log('Pipeline ' + pipelineAction + ' - ' + keyValue );
                    }
                }
            }
            if (keyValue == 'None') {
                callback('Error in getting status'); 
            }else {
                var output = {
                    result : keyValue
                };
                callback(null, output);    
            }
        }
    });

}


function deactivateDataPipeline(pipelineId,datapipeline,pipelineName,callback) {
                
	console.log('deactivate');
	var paramsD = {
                    pipelineId: pipelineId,
                    cancelActive: true 
                };
    datapipeline.deactivatePipeline(paramsD, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(err);
        }
        else { 
            console.log(data);           // successful response
            callback(null, data);
        }
    });

}


function activateDataPipeline(pipelineId,datapipeline,pipelineName,callback) {
                
	console.log('activate');
	var paramsId = {
                pipelineId: pipelineId /* required */
            };
    datapipeline.activatePipeline(paramsId, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(err);
        }
        else { 
            console.log(data);           // successful response
            callback(null, data);
        }
    });

}

function setDataPipelineComponentStatus(pipelineId,objectId,pipelineName,pipelineComponentName,datapipeline,pipelineAction,callback) {

   var paramsS = {
                        objectIds: [ objectId ],
                        pipelineId: pipelineId,
                        status: pipelineAction
                    };
    datapipeline.setStatus(paramsS, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(err);
        } else { 
            console.log(data);           // successful response
            callback(null, data);
        }
    });


}

function searchDataPipelineComponent(pipelineName,pipelineComponentName,pipelineObjectListData,callback) {

	var pipelineComponentNameFound = 'None'
	var cnt=0;
    for (var i in pipelineObjectListData.pipelineObjects){
        if(pipelineObjectListData.pipelineObjects[i].name.toUpperCase().indexOf(pipelineComponentName) > -1) {
            pipelineComponentNameFound = pipelineObjectListData.pipelineObjects[i].name.toUpperCase();
            cnt = cnt + 1;
            console.log('Search pipeline component found');
        }
    }
	if (pipelineComponentNameFound == 'None') {
        console.log('No Component found');
        callback('No Component ' + pipelineComponentName + ' found for pipeline ' + pipelineName);
    } else {
        if (cnt == 1) {
	        var output = {
                componentName : pipelineComponentNameFound
            };
            callback(null, output);   	
        } else {
            callback('Found more than one component. Please search again.');
        }    
	}

}
							
function searchDataPipeline(pipelineName,pipelineListData,callback) {
    console.log(pipelineName);
	var pipelineNameFound = 'None';
	var cnt = 0;
	for (var i in pipelineListData.pipelineIdList){
	   console.log(pipelineListData.pipelineIdList[i].name.toUpperCase().indexOf(pipelineName));
       if(pipelineListData.pipelineIdList[i].name.toUpperCase().indexOf(pipelineName) > -1) {
         pipelineNameFound = pipelineListData.pipelineIdList[i].name.toUpperCase();
         cnt =  cnt + 1;
         console.log('Search pipeline found');
       }
    }
	if (pipelineNameFound == 'None') {
        console.log('No pipeline found');
        callback('Pipeline ' + pipelineName + ' not found.');
    } else {
        if (cnt==1) {
	        var output = {
                pipelineName : pipelineNameFound
            };
            callback(null, output);   
        } else {
            callback('Found more than one job. Please search again.');
        }    
	}

}

function getDataPipelineComponent(pipelineId,datapipeline,pipelineName,pipelineComponentName,pipelineAction,callback) {
    
	var objectId = 'None'
	var paramsId = {
					pipelineId: pipelineId /* required */
                   };
			
    console.log('ComponentProperty');
    datapipeline.getPipelineDefinition(paramsId, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        }
        else {
			console.log(data);           // successful response
			if (pipelineAction ==='SEARCH') {
				searchDataPipelineComponent(pipelineName,pipelineComponentName,data,callback)
			} else {
				for (var i in data.pipelineObjects){
					if (data.pipelineObjects[i].name.toUpperCase() == pipelineComponentName) {
						objectId = data.pipelineObjects[i].id;
						console.log('Component Name Found.');
					}
				}
				if (objectId == 'None') {
					callback('No Component ' + pipelineComponentName + ' found for pipeline ' + pipelineName);
				} else {
					if (pipelineAction == "RESUME" ||  pipelineAction == "PAUSE"   ) {
						setDataPipelineComponentStatus(pipelineId,objectId,pipelineName,pipelineComponentName,datapipeline,pipelineAction,callback)	
					} else {
						getDataPipelineComponentInstance(pipelineId,datapipeline,objectId,pipelineAction,pipelineName,pipelineComponentName,callback)
					}
				}	
			}
		}	
	});		

}	


function getDataPipelineComponentInstance(pipelineId,datapipeline,objectId,pipelineAction,pipelineName,pipelineComponentName,callback) {
	var paramsOD = {
        objectIds: [ objectId ],
        pipelineId: pipelineId
    };
    datapipeline.describeObjects(paramsOD, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(err);
        }
        else { 
            console.log('Component Instance check.');
            console.log(data);           // successful response
            var keyName = 'None';
			var objectInstanceId = 'None';
			var keyValue = 'None';
            if (pipelineAction=="STATE") {
                keyName = "@status";
            } 
            if (pipelineAction=="STATUS") {
                keyName = "@healthStatus";
            }
            for (var i in data.pipelineObjects){
                for ( var j in data.pipelineObjects[i].fields){
                    if (data.pipelineObjects[i].fields[j].key == "@activeInstances") {
                        objectInstanceId = data.pipelineObjects[i].fields[j].refValue;
                        console.log('Component Instance Id - ' + objectInstanceId );
                    }
                    if (data.pipelineObjects[i].fields[j].key == keyName) {
                        keyValue = data.pipelineObjects[i].fields[j].stringValue;
                        console.log('Component ' + pipelineAction + ' - ' + keyValue );
                    }
                }
            }
            if ( pipelineAction == "RERUN" || pipelineAction == "MARK_FINISHED" || pipelineAction == "TRY_CANCEL" ) {
				if (objectInstanceId != "None") {
					setDataPipelineComponentStatus(pipelineId,objectInstanceId,pipelineName,pipelineComponentName,datapipeline,pipelineAction,callback);
				}
				else { 
					callback('No object Instance Id found for Component - ' + pipelineComponentName);
				}	
            } 
            if (pipelineAction == "STATE" || pipelineAction == "STATUS" ) {
			    if (keyValue != "None" ) {
					var output = {
						result : keyValue
					};
					callback(null,output);
				} else {
					callback('No ' + pipelineAction + ' found for Component - ' + pipelineComponentName);				
				}
            }
        }   
    });
}

function getDataPipeline(pipelineName,pipelineComponentName,pipelineAction,callback) {

    var datapipeline = new AWS.DataPipeline();
	
	var pipelineId ='None';
	
	var paramsall = {
        marker:''
    };

    datapipeline.listPipelines(paramsall, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(err);
        }
        else { 
            console.log(data);           // successful response
			if (pipelineAction ==='SEARCH' && pipelineComponentName.length<1) {
				searchDataPipeline(pipelineName,data,callback);
			} else {
					for (var i in data.pipelineIdList){
						if (data.pipelineIdList[i].name.toUpperCase() === pipelineName) {
							pipelineId = data.pipelineIdList[i].id;
							console.log('Pipeline Name found.');
						}
					}
					if (pipelineId == 'None') {
						console.log('No pipeline found');
						callback('Pipeline ' + pipelineName + ' not found.');
					} else if (pipelineComponentName.length>0) {
								getDataPipelineComponent(pipelineId,datapipeline,pipelineName,pipelineComponentName,pipelineAction,callback);
					} else {
					    switch (pipelineAction)
						{
							case 'ACTIVATE': 
								activateDataPipeline(pipelineId,datapipeline,pipelineName,callback);
								break;
							case 'DEACTIVATE': 
								deactivateDataPipeline(pipelineId,datapipeline,pipelineName,callback);
								break;
							default:  //STATE OR STATUS
								getDataPipelineStatus(pipelineId,datapipeline,pipelineName,pipelineAction,callback);
						}
					}
			}
		}	
	});
}

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var pipelineName = event.pipelineName.toUpperCase();
    var pipelineComponentName = event.pipelineComponentName.toUpperCase();
    var pipelineAction = event.pipelineAction.toUpperCase();


	var errMsg = "None";
	
    console.log('Pipeline = ', pipelineName);
    console.log('ComponentName = ', pipelineComponentName);
    console.log('Action = ', pipelineAction);


	
	if ( pipelineName.length==0) {
		errMsg = "Pipeline name not Provided.";
	}  else {
		var actions = ['RESUME','PAUSE','RERUN','TRY_CANCEL','MARK_FINISHED','STATE','STATUS','SEARCH','ACTIVATE','DEACTIVATE']
		if (actions.indexOf(pipelineAction) < 0) {
			errMsg = "Invalid Action";
		} else { //pipeline component cannot be activated or deactivated
			var pipelineComponentNameLen = pipelineComponentName.length;
			if (pipelineComponentNameLen > 0 && ( pipelineAction=="ACTIVATE"  || pipelineAction=="DEACTIVATE" )) {
				errMsg = "Invalid Option provided for component";
			} else { //pipeline cannot be paused,resumed,rerun,trycancel,markfinished
				if ( pipelineComponentNameLen == 0 && ( pipelineAction=="RESUME"  || pipelineAction=="PAUSE" || pipelineAction=="RERUN" || pipelineAction=="TRY_CANCEL" || pipelineAction=="MARK_FINISHED" )) {
					errMsg="Invalid Option provided for pipeline";
				} 
			}
		}		
	}	
	
	
	if (errMsg == "None") {
       // all checks done
	   getDataPipeline(pipelineName,pipelineComponentName,pipelineAction,callback);
	} else {
		callback(errMsg);
	}
	
};
