<?php
header('Content-Type: application/json');

echo json_encode([
  'status' => 'ok',
  'message' => 'PHP is running correctly!',
  'note' => 'This endpoint is for health check or future use. WebSocket signaling is handled by Node.js.'
]);
?>
