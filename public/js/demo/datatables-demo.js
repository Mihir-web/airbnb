// Call the dataTables jQuery plugin
$(document).ready(function() {
  $('#dataTable').DataTable({
    "bPaginate": false,
    "bFilter": false,
    "bInfo": false
  });
});
