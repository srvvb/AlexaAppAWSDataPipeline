

'use strict';

/**
 * This code is for Amazon Echo Alexa App to activate,deactivate,pause,resume
 * ,mark finish, retry, cancel, get state & status of AWS Data Pipeline
 */


// --------------- Helpers that build all of the responses -----------------------

var AWS = require('aws-sdk');


function resultComponentAction(resultMsg, sessionAttribs,intent, session, callback) {
    const cardTitle = intent.name;
    let repromptText = '';
    var sessionAttributes = sessionAttribs;
    const shouldEndSession = false;
    const pipelineNameRaw = sessionAttributes.pipelineNameRaw;
    const pipelineName =  sessionAttributes.pipelineName;
    const componentNameRaw = sessionAttributes.componentNameRaw;
    const componentName =  sessionAttributes.componentName;    
    const action = sessionAttributes.action;
    let speechOutput = '';

    if (resultMsg.hasOwnProperty('result')) {
        var retStatus = resultMsg.result;
        speechOutput = `${action} of Pipeline ${pipelineNameRaw} and component ${componentNameRaw} is ${retStatus}.`;
    } else if (resultMsg.hasOwnProperty('componentName')) {
        var componentNameFound = resultMsg.componentName;
        sessionAttributes.componentName = componentNameFound;
        sessionAttributes.componentNameRaw = componentNameFound;
        speechOutput = `Found component ${componentNameFound}.`;
    } else if (Object.keys(resultMsg).length === 0) {
        speechOutput = `Component ${componentNameRaw} of Pipeline ${pipelineNameRaw} is set to ${action}.`;
    } else {
        var errMsg = resultMsg.errorMessage
        speechOutput = `Failed to get or perform action ${action} for component ${componentNameRaw} of Pipeline ${pipelineNameRaw}.` +
          ` Error Message is ${errMsg}.`;
        repromptText = speechOutput;  
    }
    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    
}

function resultPipelineAction(resultMsg, sessionAttribs,intent, session, callback) {
    const cardTitle = intent.name;
    let repromptText = '';
    var sessionAttributes = sessionAttribs;
    const shouldEndSession = false;
    const pipelineNameRaw = sessionAttributes.pipelineNameRaw;
    const pipelineName =  sessionAttributes.pipelineName;
    const action = sessionAttributes.action;
    let speechOutput = '';

    if (resultMsg.hasOwnProperty('result')) {
        var retStatus = resultMsg.result;
        speechOutput = `${action} of Pipeline ${pipelineNameRaw} is ${retStatus}.`;
    } else if (resultMsg.hasOwnProperty('pipelineName')) {
        var pipelineFound = resultMsg.pipelineName;
        sessionAttributes.pipelineName = pipelineFound;
        sessionAttributes.pipelineNameRaw = pipelineFound;
        speechOutput = `Found Pipeline ${pipelineFound}.`;
    } else if (Object.keys(resultMsg).length === 0) {
        speechOutput = `Pipeline ${pipelineNameRaw} is ${action}D.`;
    } else {
        var errMsg = resultMsg.errorMessage
        speechOutput = `Failed to get or perform action ${action} for Pipeline ${pipelineNameRaw}.` +
          ` Error Message is ${errMsg}.`;
        repromptText = speechOutput;   
    }
    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    
}



function DPCall(methodType,sessionAttribs, intent, session, callback) {
  
  var sessionAttributes = sessionAttribs;
  //var payload = JSON.stringify({ "pipelineName": "JOB_SYNET", "pipelineAction": "status", "pipelineObjectName": ""})
  console.log(`last method type in getconfirmation - ${methodType}`)
  
  if (methodType=='Pipeline') {
    var payload = {
        pipelineName: sessionAttributes.pipelineName,
        pipelineAction: sessionAttributes.action,
        pipelineComponentName: ''
    };
  } else {
    var payload = {
        pipelineName: sessionAttributes.pipelineName,
        pipelineAction: sessionAttributes.action,
        pipelineComponentName: sessionAttributes.componentName
    };
  }
  
  var payloadString = JSON.stringify(payload);
  console.log(payloadString);
  
  var params = {
    FunctionName: 'AWSDPActivity', // the lambda function we are going to invoke
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: payloadString
  };

  console.log('calling lambda');
  var lambda = new AWS.Lambda();

  lambda.invoke(params, function(err, data) {
    if (err) {
      console.log('bad-'+err);
      if (methodType=='Component') {
        console.log('call component action');
        resultComponentAction(err,sessionAttributes,intent,session,callback);
      } else {
        console.log('call pipeline action');
        resultPipelineAction(err,sessionAttributes,intent,session,callback);
      }
    } else {
      var resultJSON = JSON.parse(data.Payload);
      console.log('good-'+data.Payload);
      if (methodType=='Component') {
        console.log('call component action');
        resultComponentAction(resultJSON,sessionAttributes,intent,session,callback);
      } else {
        console.log('call pipeline action');
        resultPipelineAction(resultJSON,sessionAttributes,intent,session,callback);
      }
    }
  });

}

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {
        pinApproved: 'N',
        projectName: 'None',
        serviceName: 'None',
        pipelineName: 'None',
        pipelineNameRaw: 'None',
        action : 'None',
        actionRaw: 'None',
        componentName: 'None',
        componentNameRaw: 'None',
        lastMethodType : 'None',
    };
    const cardTitle = 'Welcome to Orange Analytics';
    const speechOutput = 'Welcome to Orange Analytics. How can I help you today?';
        
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'How can I help you today?';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for visiting Orange Analytics. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}



function getPin(intent, session, callback) {
    const cardTitle = intent.name;
    const pinSlot = intent.slots.Pin;
    let repromptText = '';
    var sessionAttributes = session.attributes;
    const shouldEndSession = false;
    let speechOutput = '';

    if (pinSlot.hasOwnProperty('value')){
        // **warning** no logic written for pin validation .. add another lambda function call to validate pin and user id obtained from Alexa call
        const pin = pinSlot.value;
        sessionAttributes.pinApproved = 'Y';
        console.log(`Alexa captured pin - ${pin}`);
        const projectName = sessionAttributes.projectName;
        const serviceName = sessionAttributes.serviceName;
        speechOutput = `Your Authentication was successfull for project ${projectName} and service ${serviceName}.`;
        
    } else {
        speechOutput = "I'm not sure what your pin is. Please try again.";
        repromptText = "I'm not sure what your pin is. You can tell me  " +
            'My pin followed by six digit pincode';
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));


}

function setProject(intent, session, callback) {
    console.log(JSON.stringify(intent));
    console.log(JSON.stringify(session.attributes));
    const cardTitle = intent.name;
    const projectNameSlot = intent.slots.ProjectName;
    let repromptText = '';
    var sessionAttributes = session.attributes;
    const shouldEndSession = false;
    let speechOutput = '';

    if ( projectNameSlot.hasOwnProperty('value') ){
        // ** warning ** no logic written to validate project .. another lambda call to validate project & user
        const projectName = projectNameSlot.value;
        sessionAttributes.projectName = projectName;
        console.log(`Alexa captured project name - ${projectName}`);
        sessionAttributes.pinApproved = 'N';
        sessionAttributes.serviceName = 'None';
        speechOutput = `Please provide the service name that you would like to connect for project ${projectName}.`;
        repromptText = speechOutput;
    } else {
        speechOutput = "I'm not sure what is the project name. Please try again.";
        repromptText = "I'm not sure what is the project name. You can tell me  " +
            'Load project followed by project name and service followed by service name';
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));


}



function setService(intent, session, callback) {
    console.log(JSON.stringify(intent));
    console.log(JSON.stringify(session.attributes));
    const cardTitle = intent.name;
    const serviceNameSlot = intent.slots.ServiceName;
    let repromptText = '';
    var sessionAttributes = session.attributes;
    const shouldEndSession = false;
    let speechOutput = '';
    const projectName = sessionAttributes.projectName;

    if ( (projectName!='None') && (serviceNameSlot.hasOwnProperty('value'))){
        // ** warning ** no logic written to validate project & service  .. another lambda call to validate project  , service and user
        const serviceName = serviceNameSlot.value;
        sessionAttributes.serviceName = serviceName;
        console.log(`Alexa captured service name - ${serviceName}`);
        console.log(`Project name - ${projectName}`);
        sessionAttributes.pinApproved = 'N';
        speechOutput = `Please provide your 6 digit authentication pin for project ${projectName} and service ${serviceName}.`;
        repromptText = speechOutput;
    } else {
        speechOutput = "I'm not sure what is the project name and service name. Please try again.";
        repromptText = "I'm not sure what is the project name and service name. You can tell me  " +
            'Load project followed by project name and service followed by service name';
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));


}

function getConfirmation(intent, session, callback) {
    const cardTitle = intent.name;
    const shouldEndSession = false;
    const confirmationSlot = intent.slots.Confirmation;
    var sessionAttributes = session.attributes;
    const lastMethodType = sessionAttributes.lastMethodType;
    console.log(`last method type in getconfirmation - ${lastMethodType}`)
    if (lastMethodType=='None' || (!confirmationSlot.hasOwnProperty('value'))) {
        const speechOutput = "I'm not sure what is the request. Please provide a valid reponse by saying yes , no or cancel. Please try again.";
        const repromptText = "I'm not sure what is the request. Please provide a valid reponse by saying yes , no or cancel. Please try again.";
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));   
    } else {
        sessionAttributes.lastMethodType = 'None';
        const confirmation = confirmationSlot.value;
        console.log(`Alex confirmation value - ${confirmation}`);
        console.log('before calling lambda - get confirmation');
        if (confirmation.toUpperCase()=='YES') {
            DPCall(lastMethodType,sessionAttributes,intent,session,callback);
        } else if (confirmation.toUpperCase()=='NO' || confirmation.toUpperCase()=='CANCEL') {
            const speechOutput = "Action has been cancelled.";
            const repromptText = "Action has been cancelled.";
            callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));   
        } else {
            const speechOutput = "Invalid option specified. Action has been cancelled.";
            const repromptText = "Invalid option specified. Action has been cancelled.";
            callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));   
        }   
    }
}  

function setPipeline(intent, session, callback) {
    console.log(JSON.stringify(intent));
    console.log(JSON.stringify(session.attributes));
    const cardTitle = intent.name;
    const pipelineNameSlot = intent.slots.PipelineName;    
    let repromptText = '';
    var sessionAttributes = session.attributes;
    const shouldEndSession = false;
    let speechOutput = '';
    const pinApproved = sessionAttributes.pinApproved;


    if (  ( pipelineNameSlot.hasOwnProperty('value') ) && (pinApproved=='Y')  ){
        console.log('pipeline slot');
        const pipelineNameRaw = pipelineNameSlot.value;
        sessionAttributes.pipelineNameRaw = pipelineNameRaw;
        const pipelineName = pipelineNameRaw.replace(/\s+/g, '').replace(/underscore/g,'_').replace(/underscored/g,'_');
        sessionAttributes.pipelineName = pipelineName;
        console.log(`pipeline search raw name - ${pipelineNameRaw}`);
        console.log(`pipeline search name - ${pipelineName}`);
        console.log(`Action - search`);     
        sessionAttributes.action = 'SEARCH';
        sessionAttributes.actionRaw = 'search'; 
        console.log('pipeline lambda call');
        const methodType = 'Pipeline';
        DPCall(methodType,sessionAttributes,intent,session,callback);
    } else {
        speechOutput = "I'm not sure what is pipeline name. Please try again.";
        repromptText = "I'm not sure what is pipeline name. You can tell me  " +
                            'load pipeline followed by pipeline name';
        callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }

}


function unknownIntent(intent, session, callback) {
    console.log(JSON.stringify(intent));
    console.log(JSON.stringify(session.attributes));
    const cardTitle = intent.name;
    let repromptText = '';
    var sessionAttributes = session.attributes;
    const shouldEndSession = false;
    let speechOutput = '';
    speechOutput = "I'm not sure what is the request.";
    repromptText = "I'm not sure what is the request.";

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));


}

function setComponent(intent, session, callback) {
    console.log(JSON.stringify(intent));
    console.log(JSON.stringify(session.attributes));
    const cardTitle = intent.name;
    const componentNameSlot = intent.slots.ComponentName;    
    let repromptText = '';
    var sessionAttributes = session.attributes;
    const shouldEndSession = false;
    let speechOutput = '';
    const pinApproved = sessionAttributes.pinApproved;

    if (  ( componentNameSlot.hasOwnProperty('value') ) && (pinApproved=='Y') && (pinApproved=='Y')  && (sessionAttributes.pipelineNameRaw!='None')  ){
        console.log('component slot');
        const componentNameRaw = componentNameSlot.value;
        sessionAttributes.componentNameRaw = componentNameRaw;
        const componentName = componentNameRaw.replace(/\s+/g, '').replace(/underscore/g,'_').replace(/underscored/g,'_');  
        sessionAttributes.componentName = componentName;        
        console.log(`component search name raw - ${componentNameRaw}`);
        console.log(`component search name - ${componentName}`);
        console.log(`Action - search`);     
        sessionAttributes.action = 'SEARCH';
        sessionAttributes.actionRaw = 'search'; 
        console.log('component lambda call');
        const methodType = 'Component';
        DPCall(methodType,sessionAttributes,intent,session,callback);

    } else {
        speechOutput = "I'm not sure what is pipeline name or component name. Please try again.";
        repromptText = "I'm not sure what is pipeline name or component name. You can tell me  " +
                            'load component followed by component name';
        callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

    }




}



function performAction(methodType,intent, session, callback) {
    console.log(JSON.stringify(intent));
    console.log(JSON.stringify(session.attributes));
    const cardTitle = intent.name;  
    const actionSlot = intent.slots.Action;
    let repromptText = '';
    let speechOutput = '';
    const shouldEndSession = false;
    var sessionAttributes = session.attributes;
    const pinApproved = sessionAttributes.pinApproved;
    var action = '';
	var actionRaw = '';
    var componentNameRaw = '';
    var pipelineNameRaw = '';
    var pipelineName = '';
    var componentName = '';
	
    
    if ( methodType == 'Pipeline' && !( ( sessionAttributes.pipelineNameRaw!='None' ) && (actionSlot.hasOwnProperty('value')) && (pinApproved=='Y') ) ) {
            speechOutput = "I'm not sure what is pipeline name and action. Please try again.";
            repromptText = "I'm not sure what is pipeline name and action. You can tell me  " +
                            'What is status of pipeline followed by pipeline name';
    } else {
		if (methodType == 'Component' && !( ( sessionAttributes.pipelineNameRaw!='None') && (actionSlot.hasOwnProperty('value')) && (sessionAttributes.componentNameRaw!='None')  && (pinApproved=='Y') ) ) {
		    speechOutput = "I'm not sure what is pipeline name , component name and action. Please try again.";
            repromptText = "I'm not sure what is pipeline name , component name and action. You can tell me  " +
                            'What is status of pipeline followed by pipeline name and component followed by component name';
        
		} else {
			if ( methodType == 'Component') {
				console.log('component session attribute');
				componentNameRaw = sessionAttributes.componentNameRaw;
				componentName = sessionAttributes.componentName;
				console.log(`Alexa captured component Name - ${componentNameRaw}`);        
				console.log(`Component Name - ${componentName}`); 
			}
	
			console.log('pipeline session attribute');
			pipelineNameRaw = sessionAttributes.pipelineNameRaw;
			pipelineName = sessionAttributes.pipelineName;
			console.log(`Alexa captured pipeline Name - ${pipelineNameRaw}`);
			console.log(`Pipeline Name - ${pipelineName}`);
			
			actionRaw = actionSlot.value;
			const actionRawUpper = actionRaw.toUpperCase().replace(/\s+/g, '').replace(/underscore/g,'_').replace(/underscored/g,'_'); 
			if (actionRawUpper == 'ACTIVATED' || actionRawUpper == 'ACTIVATE' ) {
				action = 'ACTIVATE';
			} else if (actionRawUpper == 'DEACTIVATED' || actionRawUpper == 'DEACTIVATE' ) {
				action = 'DEACTIVATE';
			} else if (actionRawUpper == 'CANCEL' || actionRawUpper == 'CANCELLED' || actionRawUpper == 'TRYCANCEL' || actionRawUpper == 'TRYCANCELLED' ) {
				action = 'TRY_CANCEL';
			} else if (actionRawUpper == 'FINISH' || actionRawUpper == 'MARKFINISHED' || actionRawUpper == 'FINISHED' || actionRawUpper == 'MARKFINISH' ) {
				action = 'MARK_FINISHED' ;       
			} else if (actionRawUpper == 'RE-RUN' || actionRawUpper == 'RERUN' ) {
				action = 'RERUN';
			} else if (actionRawUpper == 'PAUSE' || actionRawUpper == 'PASUED') {
				action = 'PAUSE';                 
			} else if (actionRawUpper == 'RESUME' || actionRawUpper == 'RESUMED'  ) {
				action = 'RESUME';                      
			} else {
				action = actionRawUpper;
			}  
			console.log(`Alexa captured action - ${action}`);
			console.log(`Action - ${action}`);     
			sessionAttributes.action = action;
			sessionAttributes.actionRaw = actionRaw;        
    
			var actions = ['RESUME','PAUSE','RERUN','TRY_CANCEL','MARK_FINISHED','STATE','STATUS','ACTIVATE','DEACTIVATE']
			if (actions.indexOf(action) < 0) {
				speechOutput = `Invalid action ${actionRaw} specified. Please try again.`;
				repromptText = `Invalid action ${actionRaw} specified. Please try again.` +
                        'Valid options are ACTIVATE,DEACTIVATE,STATE,STATUS,PAUSE,RESUME,RETRY,CANCEL AND MARK FINISH';
			}
		
		
		}
	
	}
		
  
    
     
    if (speechOutput.length>0) {
		// error chck
	    callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));     
	} else {
		if ( action=='STATE' || action=='STATUS' ) {
			// no confirmation check`
			console.log('pipeline lambda call');
			DPCall(methodType,sessionAttributes,intent,session,callback);
		} else {
			// confirmation check
			console.log('confirmation check');
			sessionAttributes.lastMethodType = methodType; 
			console.log(`last method type in getconfirmation - ${methodType}`)
			if (methodType=='Component') {
				speechOutput = `Please confirm you want to set status to ${actionRaw} for component ${componentNameRaw} of pipeline ${pipelineNameRaw}`;
			} else {
				speechOutput = `Please confirm you want to set status to ${actionRaw} for pipeline ${pipelineNameRaw}`;
			}
			repromptText = speechOutput;
			callback(sessionAttributes,
				buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
		}
	}	
    
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'LoadProject') {
        setProject(intent, session, callback);
    } else if (intentName === 'LoadService') {
        setService(intent, session, callback);
    } else if (intentName === 'LoadPipeline') {
        setPipeline(intent, session, callback);  
    } else if (intentName === 'LoadComponent') {
        setComponent(intent, session, callback);                 
    } else if (intentName === 'PipelineAction') {
        performAction('Pipeline',intent, session, callback);
    } else if (intentName === 'GetPin') {
        getPin(intent, session, callback);
    } else if (intentName === 'GetConfirmation') {
        getConfirmation(intent, session, callback);    
    } else if (intentName === 'ComponentAction'  ) {
        performAction('Component',intent, session, callback);                        
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent' || intentName === 'ExitApp') {
        handleSessionEndRequest(callback);
    } else {
        unknownIntent(intent, session, callback);
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
