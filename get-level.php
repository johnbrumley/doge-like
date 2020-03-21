<?php

header('Content-Type: text/plain');
$level_num = rand(1,21);
$level = file_get_contents(__DIR__ . '/levels/level'. $level_num . '.txt');
echo $level;

?>