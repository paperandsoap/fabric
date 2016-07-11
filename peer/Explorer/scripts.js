const REST_ENDPOINT = 'http://127.0.0.1:5000';

var App = angular.module("explorer", []);

// http request to get get chain information
App.factory('REST_SERVICE_HEIGHT', function($http){
	return{
		getData: function(){
			return $http.get(REST_ENDPOINT+ "/chain").then(function(result){
				return result.data;
			});
	}}
});

/* http request to retrieve information related to a specific block number found on the chain, chain_index is the block number that we wish to retrieve
Since each request comes back at a different time and out of order, the order with which we recieve the response cannot be tracked, array_location is thus passed in and is added
as metadata to keep track of the 0-9 index where the data should be added to the array in the BLOCKS_and_TRANSACTIONS controller that holds the final retrieved inorder result
*/
App.factory('REST_SERVICE_BLOCK', function($http) {
   return {
     getData: function(chain_index, array_location) {
     	// initially returns only a promise 
       return $http.get(REST_ENDPOINT +"/chain/blocks/"+ chain_index).then(function(result) {
       		// add metadata 
       		result.data.location = array_location; // will always be 0-9 since the explorer displays the 10 most recent blocks
       		result.data.block_origin = chain_index; // can be any number from 0 to the current height of the chain 
           return result.data // retrieved data returned only after response from server is made 
       });
   }
}
});

// http request to get block information by block#, used in search, doesn't add any metadata
App.factory('REST_SERVICE_BLOCK2', function($http) {
   return {
     getData: function(chain_index) {
       return $http.get(REST_ENDPOINT +"/chain/blocks/"+ chain_index).then(function(result) {   	
           return result.data;
       });
   }
}
});

// http request to get transaction information by UUID, used in search 
App.factory('REST_SERVICE_TRANSACTIONS', function($http){
	return{
		getData: function(uuid){
			return $http.get(REST_ENDPOINT+ "/transactions/"+ uuid).then(function(result){
				return result.data;
			});
	}}
});

/* factory to share information between controllers, the BLOCK controller gets the 10 most recent blocks, parses the information 
and then puts the all the transactions from the 10 recent blocks into an array that gets broadcasted to the TRANSACTION controller that displays it. Likewise, chain
information also broadcasted to controllers one retrieved
*/
App.factory('SHARE_INFORMATION', function($rootScope){
	var BlockInfo = {};

	BlockInfo.load_broadcast_transactions = function(data){
		this.transactions = data;
		this.broadcastItem();
	}
	BlockInfo.load_broadcast_chain = function(data){
		this.chain = data;
		this.broadcastItem();
	}
	BlockInfo.broadcastItem = function(){
		$rootScope.$broadcast('handle_broadcast');
	}

	return BlockInfo;
})

/*-----------------------------Controllers for HTML div elements------------------------------------ */

App.controller("HEADER", 
	function(){	
	}
)

App.controller("NAVIGATION", 
	function(){
	}
)


App.controller("CURRENT", 
	function($scope, REST_SERVICE_HEIGHT, SHARE_INFORMATION)
	{
		REST_SERVICE_HEIGHT.getData().then(function(data){
			// after response from server, load reponse to $scope.info to display on screen and then broadcast to BLOCKS controller to share chain status info 
			$scope.info = data;
			SHARE_INFORMATION.load_broadcast_chain($scope.info);
		});
	}
)

App.controller("SEARCH", 
	function($scope, REST_SERVICE_TRANSACTIONS, REST_SERVICE_BLOCK2)
	{
	    $scope.search = function(){
	    	$scope.found = 0;
			// first we search by UUID
			REST_SERVICE_TRANSACTIONS.getData($scope.response).then(function(data){

					// convert transaction seconds to date 
					var date = new Date(null);
					date.setSeconds(data.timestamp.seconds);
					data.date = date;
										   
					$scope.found = 1;
		    		$scope.info = data;
		    		$scope.message = "Transaction succesfully found";
		    		$scope.text1 = "Chaincode ID: " +$scope.info.chaincodeID;
		    		$scope.text2 = "UUID: " +$scope.info.uuid;
		    		$scope.text3 = "Seconds: " +$scope.info.timestamp.seconds;
		    		$scope.text4 = "Nanos: " +$scope.info.timestamp.nanos;
		    		$scope.text7 = "Date: " +$scope.info.date ;
		    		$scope.text5 = null;
		    		$scope.text6 = null;
			});
			// if nothing is found by uuid, we seach by block number
			REST_SERVICE_BLOCK2.getData($scope.response).then(function(data){

						// convert from Seconds to date

						// convert block timestamp
						var date = new Date(null);
						date.setSeconds(data.nonHashData.localLedgerCommitTimestamp.seconds);
						date.toISOString().substr(11, 8);
						data.nonHashData.localLedgerCommitTimestamp.date = date;

						//convert timestamps of all transactions on block
							for(var k=0; k<data.transactions.length; k++){
								var date2 = new Date(null);
								date2.setSeconds(data.transactions[k].timestamp.seconds);
								data.transactions[k].date = date2;
							}

						$scope.found =1;
						$scope.info = data;
		    			$scope.message = "Block succsefully found";
		    			$scope.text1 =  "StateHash: " + $scope.info.stateHash;
		    			$scope.text2 =  "Previous Hash: " + $scope.info.previousBlockHash;
		    			$scope.text3 =  "Consensus Meta: " + $scope.info.consensusMetadata;
		    			$scope.text4 =  "Seconds: " + $scope.info.nonHashData.localLedgerCommitTimestamp.seconds;
		    			$scope.text5 =  "Nanos: " + $scope.info.nonHashData.localLedgerCommitTimestamp.nanos;
		    			$scope.text6 = null; // clear in to avoid displaying previous transaciton count if new block search has 0 
		    			$scope.text6 = 	"Transactions: " + $scope.info.transactions.length;
		    			$scope.text7 =  "Date: " + $scope.info.date;
		    			if($scope.info.transactions.length != null){
	     					document.getElementById("change").style.display = "block";
	     				} else {
	     					$scope.text6 = 0;	
	     					document.getElementById("change").style.display = "none";
	     				}
			});	

			if($scope.found == 0){
				$scope.message = "no information found";
				$scope.info = null;
				$scope.text1 = null;
				$scope.text2 = null;
				$scope.text3 = null;
				$scope.text4 =  null;
				$scope.text5 = null;
				$scope.text6 = null;
				$scope.text7 = null;
				document.getElementById("change").style.display = "none";
			}
					//animate slideout only after the the information is ready to display
					setTimeout(function(){ 
		    			if(document.getElementById("panel").style.display != "none"){
				   	    	// don't slide since already visible
						} else{
							$(document).ready(function(){
							$("#panel").slideToggle(1000);});	
							}}, 400);
		};

		$scope.clear = function(){
			$scope.response = "";
			if(document.getElementById("panel").style.display == "none"){
				// already hidden, don't wan't to animate again
				$scope.found= 0;
				$scope.info = null;
			    $scope.message = null;
			    $scope.text1 =  null;
			    $scope.text2 =  null;
			    $scope.text3 =  null;
			    $scope.text4 =  null;
			    $scope.text5 =  null;
			    scope.text6 = null; 
			    $scope.text7 = null;
			}
			else{
				// panel is visible, we need to hide it		
				$(document).ready(function(){
					$("#panel").slideToggle(1000);		
				});	
				// after slideout animation is complete, clear everything
				setTimeout(function(){ 
					$scope.found = 0;
					$scope.info = null;
				    $scope.message = null;
				    $scope.text1 =  null;
				    $scope.text2 =  null;
				    $scope.text3 =  null;
				    $scope.text4 =  null;
				    $scope.text5 =  null;
				    $scope.text6 = null; 
				    $scope.text7 = null;
					}, 100);
			}
		}
	}
)

App.controller("NETWORK", 
	function($scope, $http)
	{
		$http.get(REST_ENDPOINT.concat('/network/peers')).
	    success(function(data)
	     {$scope.info = data;} );
	}
)

// directive for dependency injection, used to inject d3.js graphs into html page
App.directive('barsChart', function ($parse) {

     var directiveDefinitionObject = {
        
         restrict: 'E',
         replace: false,
         scope: {data: '=chartData'},
         link: function (scope, element, attrs) {

	           var chart = d3.select(element[0]);

	            chart.append("div").attr("class", "chart")

		            .selectAll('div')
		            .data(scope.data).enter().append("div")
		            .transition().ease("elastic")
		            .style("width", function(d) { return d + "%"; })
		            .text(function(d) { return d; })


         } 
      };
      return directiveDefinitionObject;
});


App.controller("GRAPH",
	function($scope)
	{
		// TODO, just placeholders atm with no meaningful data

				$scope.latency = 50;
				$scope.capacity = "10.1K";

				$scope.data = {
					    Options: [
					      {id: '1', name: 'Option A'},
					      {id: '2', name: 'Option B'},
					      {id: '3', name: 'Option C'}
					    ],
					    selected: {id: '1', name: 'Option A'}
					};

				$scope.data2 = {
					    Options: [
					      {id: '1', name: 'Option A'},
					      {id: '2', name: 'Option B'},
					      {id: '3', name: 'Option C'}
					    ],
					    selected: {id: '1', name: 'Option A'}
					};

				$scope.data3 = {
					    Options: [
					      {id: '1', name: 'Option A'},
					      {id: '2', name: 'Option B'},
					      {id: '3', name: 'Option C'}
					    ],
					    selected: {id: '1', name: 'Option A'}
					};

				$scope.data4 = {
					    Options: [
					      {id: '1', name: 'Option A'},
					      {id: '2', name: 'Option B'},
					      {id: '3', name: 'Option C'}
					    ],
					    selected: {id: '1', name: 'Option A'}
					};

			$scope.data_1= [10,20,30,40,60];
			$scope.data_2= [100,40,20,90,60];
			$scope.data_3= [110,30,30,20,90];
			$scope.data_4= [130,70,20,20,70];
	}
);



App.controller("TRIGGER",
	function($scope){
		// collapse and expand navigation menu in mobile/smaller resolution view 
		$scope.activate = function(){
			x = document.getElementById('navigation').style.display;
				if(x =="none"){
					document.getElementById("navigation").style.display = "block";
				} else {
					document.getElementById("navigation").style.display = "none";
				}
			}
	}
)

App.controller("BLOCKS", 
	function($scope, REST_SERVICE_BLOCK, REST_SERVICE_HEIGHT,SHARE_INFORMATION)
	{
			    // Used to update which block or transaction information should display once user chooses view or expand button from table
			    $scope.selected = 0;
			    $scope.initial = 0;

			    $scope.loader= {
			    	loading: true,
			    };
			    $scope.hideloader = function(){
			    	$scope.loader.loading = false;
			    }

				$scope.update = function(height){
					var j = 0; 
					var count = 0; // keep track of server responses number of responses from server 
						for(var i=height; i>(height-$scope.info.length); i--){
						  	 REST_SERVICE_BLOCK.getData(i,j).then(function(data) {
						  	 					// executes after getData resolves with server response

						  	 					var date = new Date(null);
											    date.setSeconds(data.nonHashData.localLedgerCommitTimestamp.seconds);
											    date.toISOString().substr(11, 8);
											    data.nonHashData.localLedgerCommitTimestamp.date = date;

										   		$scope.info[data.location] = data;
										   			for(var k=0; k<data.transactions.length; k++){
										   				var date2 = new Date(null);
											   			date2.setSeconds(data.transactions[k].timestamp.seconds);
											   			data.transactions[k].date = date2;
										   				data.transactions[k].origin = data.block_origin;
										   			}
										   		var temp = data.block_origin;
										   		$scope.trans2[height-temp] = data.transactions;
										   		count++;

										   		// once all 10 GET requests are recieved, they will be but into one array that can then be easily displayed in the table
										   		if(count == 10){
										   			$scope.hideloader();
										   			$scope.trans = [];
													for(var i=0; i<$scope.trans2.length; i++){
														$scope.trans = $scope.trans.concat($scope.trans2[i]);
													}
													// after all the block information is ready, $scope.range is initialized which is used in ng-repeat to itterate through all blocks, initialzed now to maintain smooth animation
													$scope.range = [0,1,2,3,4,5,6,7,8,9];
													// once all the transactions are loaded, then we broadcast the information to the Transaction controller that will use it to display the information
													SHARE_INFORMATION.load_broadcast_transactions($scope.trans);
										   		}
							  		 });
						j++;
					}	
				}
				// array used to keep track of 10 most recent blocks, if more than 10 would like to be dislpayed at a time, change $scope.number_of_block_to_display and $scope.range in $scope.update()
				$scope.number_of_blocks_to_display = 10;
				$scope.info = new Array($scope.number_of_blocks_to_display);
	
				// will be used to keep track of most recent transactions, initially array of objects with transcations from each block, in the end concated to $scope.trans with a single transaction at each index
			    $scope.trans2 = new Array($scope.number_of_blocks_to_display);

			    // broadcast reciever get chain information from CURRENT controller that initially calls http request, once height is known, specific blocks begin to be retrieved in $scope.update()
				$scope.$on("handle_broadcast",function(){
 					$scope.size = SHARE_INFORMATION.chain.height;
      
			       	if($scope.initial == 0){
			       			$scope.initial++;
			       			$scope.update($scope.size-1);
			       	}
 				});

				// updates selected block number and displays form with transaction info based on selection
				$scope.ExecuteAll = function(x){
					$scope.selected = x;
					document.forms["change2"].submit();
				}

	}
)
App.controller("TRANSACTIONS",
 	function(SHARE_INFORMATION, $scope){

 		// controls number of rows to display in the table, initially set to 10
		$scope.row_amount2 = 10;

		/* used to display form with extra transaction information, onclick, selected2 is set to the $index of the table row, the displayed form knows
		which transaction information to display getElementById looking at this number*/
		$scope.selected2 = 0;

		// loading icon, is displayed while data is loading
		$scope.loader= {
			loading: true,
		};
		$scope.hideloader = function(){
			$scope.loader.loading = false;
		}

		// handle recieving information from the BLOCKS controller that initally calls the http requests
 		$scope.$on("handle_broadcast",function(){
 			$scope.trans = SHARE_INFORMATION.transactions;
 			$scope.hideloader();
 		});

 		// update seleted2 index and update form with corresponding transaction info
 		$scope.ExecuteAll2 = function(x){
			$scope.selected2 = x;
			document.forms["change3"].submit();
		}
})
// used to keep navigation menu displayed horizontally, runs whenever window resizes 
function restore() {
	var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	if(width > 500 ){
		document.getElementById("navigation").style.display = "block";
	} else {
		document.getElementById("navigation").style.display = "none";
	} 
}
