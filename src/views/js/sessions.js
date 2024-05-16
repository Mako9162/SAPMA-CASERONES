$(document).ready(function(){

	let countdownInterval;
	let modalShown = false; 
	
	function startCountdown() {
		let timeLeft = 30;
		document.getElementById('sessionTimer').textContent = timeLeft; 
		countdownInterval = setInterval(() => {
			timeLeft--;
			document.getElementById('sessionTimer').textContent = timeLeft;
	
			if (timeLeft === 0) {
				window.location.href = "/logout";
				clearInterval(countdownInterval);
			}
		}, 1000);
	}
	
	setInterval(function(){
		if (!modalShown) { 
			fetch('/verificar_sesion', {
				method: 'GET',
				credentials: 'same-origin'  
			})
			.then(response => response.json())
			.then(data => {
				if(data.sessionExpired){
					startCountdown();
					$('#sessionModal').modal('show');
					modalShown = true; 
				}
			});
		}
	}, 60000);
	
	$('#sessionModal').on('hidden.bs.modal', function () {
		clearInterval(countdownInterval);
		modalShown = false; 
	});

});