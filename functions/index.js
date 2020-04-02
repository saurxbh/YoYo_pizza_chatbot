'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

admin.initializeApp({
	credential: admin.credential.applicationDefault(),
  	databaseURL: 'https://yoyo-pizza-delivery-agent-xgol.firebaseio.com/'
});

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function addOrder(agent) {
  	const pizza_name = agent.parameters.pizza_name;
    const pizza_size = agent.parameters.pizza_size;
    const count = agent.parameters.count;
    const name = agent.parameters.name;
    const phone_number = agent.parameters.phone_number;
    const address = agent.parameters.address;
    const orderId = new Date().valueOf();
    if (count < 1) {
    	agent.add('You need to order at least 1 pizza.');
    } else {
      agent.add('Congratulations, ' + name + '! Your order of ' + count + ' ' + pizza_size + ' size ' + pizza_name + ' pizza(s) has been successfully placed. Use order ID ' + orderId + ' to track your order.' );
      return admin.database().ref('/PizzaOrder').set({
          pizza_name: pizza_name,
          pizza_size: pizza_size,
          count: count,
          name: name,
          phone_number: phone_number,
          address: address,
          orderId: orderId
      });
    }
  }
  
  function trackOrder(agent) {
  	const orderId = agent.parameters.order_id;
    const now = new Date().valueOf();
    console.log(now);
    console.log(orderId);
    console.log((now - orderId)/60000);
    if (((now - orderId)/60000) < 10) {
    	agent.add('Your order is being prepared in the kitchen.');
    } else if (((now - orderId)/60000) < 30) {
    	agent.add('Your order is on the way. It should reach you shortly.');
    } else {
    	agent.add('Your order has been delivered. Thank you for ordering from YoYo pizza.');
    }
  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('YoYo.pizza.order', addOrder);
  intentMap.set('YoYo.pizza.track', trackOrder);
  agent.handleRequest(intentMap);
});
