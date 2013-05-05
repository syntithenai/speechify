<?php
echo "<script>";
readfile('jquery.js');
echo "\n";
readfile('jquery.easing.min.js');
echo "\n";
readfile('jquery.cycle.all.js');
echo "\n";
echo "
$(document).ready(function() {
$('#slideshow').cycle({height: '600',width:'800',fit:1,fx:'blindX,blindY,blindZ,cover,curtainX,curtainY,fade,fadeZoom,growX,growY,none,scrollUp,scrollDown,scrollLeft,scrollRight,scrollHorz,scrollVert,shuffle,slideX,slideY,toss,turnUp,turnDown,turnLeft,turnRight,uncover,wipe,zoom',randomizeEffects:true});\n";
echo "});";
echo "</script>";
?>
