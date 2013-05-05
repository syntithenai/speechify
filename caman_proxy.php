<?php

// Set this to true if you want to be able to load images from a url that doesn't
// end in an image file extension. E.g. through another proxy of kinds.
define('ALLOW_NO_EXT', false);

$proxyParam = 'camanProxyUrl';

if (!$_GET[$proxyParam]) {
  exit;
}

// Grab the URL
$url = trim(urldecode($_GET[$proxyParam]));

$urlinfo = parse_url($url, PHP_URL_PATH);
$ext = array_reverse(explode(".", $urlinfo));
//print_r(['URL',$urlinfo,$ext]);
$ctype = null;
switch ($ext[0]) {
case 'gif': $ctype = 'image/gif'; break;
case 'png': $ctype = 'image/png'; break;
case 'jpeg':
case 'jpg': $ctype = 'image/jpg'; break;
default:
  if (ALLOW_NO_EXT) {
    $ctype = 'application/octet-stream';
  } else {
    exit;
  }
}
/*
//print_r(['ECHO FILE',$ctype,$url]);
// Route the image through this script

 // Getting headers sent by the client.
    $headers = apache_request_headers(); 

    // Checking if the client is validating his cache and if it is current.
    if (isset($headers['If-Modified-Since']) && (strtotime($headers['If-Modified-Since']) == filemtime($fn))) {
        // Client's cache IS current, so we just respond '304 Not Modified'.
        header('Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($fn)).' GMT', true, 304);
    } else {
        // Image not cached or cache outdated, we respond '200 OK' and output the image.
        header('Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($fn)).' GMT', true, 200);
        header('Content-Length: '.filesize($fn));
        header("Content-Type: $ctype");
		readfile($url);
    }
	*/
header("Content-Type: $ctype");
readfile($url);
?>