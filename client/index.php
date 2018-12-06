<html>

	<?php require_once($_SERVER['DOCUMENT_ROOT']."/templates/header.php"); ?>

	<div class="container" style="width: 100%; max-width: 762px; padding:0px;">
		<div id='canvasTarget'></div>
	</div>

	<!-- P5 specific scripts -->
	<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.7/p5.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.7/addons/p5.dom.min.js"></script>
	<!-- My P5 sketch files -->
	<script src="./socket.io/socket.io.js"></script>
	<script src="./entity.js"></script>
	<script src="./player.js"></script>
	<script src="./sketch.js"></script>

	<?php require_once($_SERVER['DOCUMENT_ROOT']."/templates/footer.php"); ?>

</html>