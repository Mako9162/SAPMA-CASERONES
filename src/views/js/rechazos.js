var table1;

$(document).ready(function () {

    function initDataTable() {
        var checkTogglePressed = false;
      
        table1 = $('#tabla_prot').DataTable({
            "createdRow": function (row, data, dataIndex) {
                if (data[11] === "SOP") {
                    $('td:eq(11)', row).text("Sistema Operativo");
                } else if (data[11] === "SC") {
                    $('td:eq(11)', row).text("No Aplica");
                } else if (data[11] === "SSR") {
                    $('td:eq(11)', row).text("Sistema sin revisar");
                } else if (data[11] === "SOCO"){
                    $('td:eq(11)', row).text("Sist. operativo con obs.");
                } else if (data[11] === "SFS"){
                  $('td:eq(11)', row).text("Sist. fuera de serv.");
                } else if (data[11] === "SNO"){
                  $('td:eq(11)', row).text("Sist. no operativo");
                }
    
                if (data[16] === "SOP") {
                  $('td:eq(16)', row).text("Sistema Operativo");
                } else if (data[16] === "SC") {
                    $('td:eq(16)', row).text("No Aplica");
                } else if (data[16] === "SSR") {
                    $('td:eq(16)', row).text("Sistema sin revisar");
                } else if (data[16] === "SOCO"){
                    $('td:eq(16)', row).text("Sist. operativo con obs.");
                } else if (data[16] === "SFS"){
                  $('td:eq(16)', row).text("Sist. fuera de serv.");
                } else if (data[16] === "SNO"){
                  $('td:eq(16)', row).text("Sist. no operativo");
                }
    
                var cellText = $('td:eq(12)', row).text();
                var cellTextEA = $('td:eq(16)', row).text();
                var cellTextTA = $('td:eq(14)', row).text();
    
                if (!(data[11] == "SOP" || data[16] == "SOP" || data[16] == "")) {
                    var titleText = 'Estado del equipo anterior: '+'\n' + cellTextEA + '\n' + 
                    'Tarea anterior: ' + cellTextTA + '\n' +
                    'Fecha anterior: ' + data[15];
                    $('td:eq(11)', row).attr('title', titleText).html('<span class="alerta">⚠️</span> '+ cellText);
                }
              },
            "select": {
                "style": "multi"
            },
          "dom": 'Bf<"toolbar">rtip',
          "searching": true,
          "lengthChange": false,
          "colReorder": true,
          "buttons": [
            {
              "extend": "excelHtml5",
              "text": '<i class="fa fa-file-excel-o"></i>',
              "title": "TareasRechazadas",
              "titleAttr": "Exportar a Excel",
              "className": "btn btn-rounded btn-success",
              "exportOptions": {
                "columns": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
              },
              customize: function (xlsx) {
                const sheet = xlsx.xl.worksheets["sheet1.xml"];
                $("row:first c", sheet).attr("s", "47");
              },
            },
          ],
          initComplete: function () {
          $(".toolbar").html(`
                  <style>
                  #parentFilter, #infoFilter, #subInfoFilter {
                    float: left;
                    margin-left: 10px;
                  }
  
                  #parentSelect, #infoSelect, #subInfoSelect{
                    height: 38px;
                    width: 200px;
                    border: 1px solid rgb(227, 227, 227);
                    border-radius: 4px;
                  }
  
                  #clearFilters {
                    float: left;
                    margin-left: 10px;
                    height: 38px;
                    line-height: 36px;
                    padding: 0 12px;
                    cursor: pointer;
                  }
  
                  @media (max-width: 100px) {
                  #parentFilter,
                  #infoFilter,
                  #subInfoFilter {
                      float: none;
                      margin-left: 0;
                  }
  
                  #parentSelect,
                  #infoSelect,
                  #subInfoSelect {
                      width: 100%;
                  }
                  }
                  </style>			
                  <div>
                      <div id="parentFilter">
                          <select id="parentSelect" width: 50%;>
                          </select>
                      </div>
                      <div id="infoFilter">
                          <select id="infoSelect" width: 50%;>
                          </select>
                      </div>
                      <div id="subInfoFilter">
                          <select id="subInfoSelect" width: 50%;">
                          </select>
                      </div>
                      <button id="seleccionar" type="button" class="btn btn-inline btn-warning ladda-button">Seleccionar</i></button>
                      <button id="deseleccionar" type="button" class="btn btn-inline btn-warning ladda-button" hidden="true">Anular selección</i></button>
                      <button id="clearFilters" type="button" class="btn btn-inline btn-danger btn-sm ladda-button"><i class="fa fa-filter"></i></button>
                  </div>
                `);
          },
          "bDestroy": true,
          "scrollX": true,
          "bInfo": true,
          "iDisplayLength": 15,
          "autoWidth": false,
          "language": {
              "sProcessing": "Procesando...",
              "sLengthMenu": "Mostrar _MENU_ registros",
              "sZeroRecords": "No se encontraron resultados",
              "sEmptyTable": "Sin infomación",
              "sInfo": "Mostrando un total de _TOTAL_ registros",
              "sInfoEmpty": "Mostrando un total de 0 registros",
              "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
              "sInfoPostFix": "",
              "sSearch": "Buscar:",
              "sUrl": "",
              "sInfoThousands": ".",
              "sLoadingRecords": "Cargando...",
              "oPaginate": {
                  "sFirst": "Primero",
                  "sLast": "Último",
                  "sNext": "Siguiente",
                  "sPrevious": "Anterior"
              },
              "oAria": {
                  "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
                  "sSortDescending": ": Activar para ordenar la columna de manera descendente"
              },
              "select" : {
                  "rows" : {
                      "_" : "Has seleccionado %d filas",
                      "0" : "Click en una fila para seleccionar",
                      "1" : "Has seleccionado 1 fila"
                  }
              }
          }
  
        }).on("select.dt deselect.dt", function (e, dt, type, indexes) {
          var count = table1.rows({ selected: true }).count();
          if (!checkTogglePressed) {
            if (count > 0) {
              $("#pdfs").prop("disabled", false);
            } else {
              $("#pdfs").prop("disabled", true);
            }
    
            if (count === 1) {
              $("#pdfs1").prop("hidden", false);
              $("#pdfs").prop("hidden", true);
            } else if (count > 1) {
              $("#pdfs").prop("hidden", false);
              $("#pdfs1").prop("hidden", true);
            } else {
              $("#pdfs").prop("hidden", true);
              $("#pdfs1").prop("hidden", true);
            }
          }
        }).columns.adjust();
  
        $('#parentSelect').append('<option value="" selected disabled>Seleccione una especialidad</option>');
        $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
        $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
        
        table1.column(6).data().unique().sort().each(function(value, index) {
          $('#parentSelect').append(
          '<option value="' + value + '">' + value + '</option>');
        });
  
        $('#parentSelect').on('change', function(e) {
          var selectedValue = $(this).val();
          table1.column(6).search(selectedValue).draw();
  
          $('#infoSelect').empty();
          $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
          table1.column(7, {search: 'applied'}).data().unique().sort().each(function(value, index) {
              $('#infoSelect').append('<option value="' + value + '">' + value + '</option>');
          });
        });
  
        $('#infoSelect').on('change', function(e) {
          var selectedParentValue = $('#parentSelect').val();
          var selectedInfoValue = $(this).val(); 
      
          table1.column(6).search(selectedParentValue).column(7).search(selectedInfoValue).draw();
      
          $('#subInfoSelect').empty(); 
          $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
          table1.column(8, {search: 'applied'}).data().unique().sort().each(function(value, index) {
              $('#subInfoSelect').append('<option value="' + value + '">' + value + '</option>');
          });
        });
  
        $('#subInfoSelect').on('change', function(e) {
          var selectedParentValue = $('#parentSelect').val();
          var selectedInfoValue = $('#infoSelect').val(); 
          var selectedSubInfoValue = $(this).val();
  
          table1.column(6).search(selectedParentValue);
          table1.column(7).search(selectedInfoValue);
          table1.column(8).search("^" + selectedSubInfoValue + "$", true, false);
  
          table1.draw();
        });
  
        $('#clearFilters').on('click', function() {
          $('#parentSelect').empty();
          $('#parentSelect').append('<option value="" selected disabled>Seleccione una especialidad</option>');
          table1.column(6).data().unique().sort().each(function(value, index) {
            $('#parentSelect').append(
            '<option value="' + value + '">' + value + '</option>');
          });
          $('#infoSelect').empty();
          $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
          $('#subInfoSelect').empty(); 
          $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
          table1.search('').columns().search('').draw();
          return false;
        });
  
        table1.on('user-select', function (e, dt, type, cell, originalEvent) {
            var rowIndex = cell.index().row;
            var rowData = table1.row(rowIndex).data();
            
            if (rowData[19] === "") {
                e.preventDefault();
            }
        });
  
        var filasSeleccionadasPorSeleccionar = []; 
  
        $('#seleccionar').on('click', function () {
            var filasSeleccionadasPorSeleccionar = table1.rows(function (idx, data, node) {
                return data[19] !== "";
            }).indexes(); 
            
            var filasFiltradasSeleccionadas = table1.rows({ search: 'applied' }).indexes().filter(function(index) {
                return filasSeleccionadasPorSeleccionar.indexOf(index) !== -1;
            });
            
            table1.rows(filasFiltradasSeleccionadas).select();
        
            $('#seleccionar').prop('hidden', true);
            $('#deseleccionar').prop('hidden', false);
        });
        
        $('#deseleccionar').on('click', function () {
            var filasSeleccionadasPorSeleccionar = table1.rows(function (idx, data, node) {
                return data[19] !== "";
            }).indexes(); 
            
            var filasFiltradasSeleccionadas = table1.rows({ search: 'applied' }).indexes().filter(function(index) {
                return filasSeleccionadasPorSeleccionar.indexOf(index) !== -1;
            });
            
            table1.rows(filasFiltradasSeleccionadas).deselect();
  
            $('#seleccionar').prop('hidden', false);
            $('#deseleccionar').prop('hidden', true);
        });     
    }
    
    initDataTable(); 

    $("#mensaje").on("click", function () {

        var fechaActual = new Date();
        var dia = fechaActual.getDate(); 
        var mes = fechaActual.getMonth() + 1; 
        var ano = fechaActual.getFullYear();
        var date = dia + "-" + mes + "-" + ano;

        var idt= [];

        var data = table1.rows({selected: true}).nodes();

        if(!data.length){
            swal("Error", "Debe seleccionar al menos una fila","error");
            return;
        }

        $.each(data, function (index, value) {
            var rowData = [];
            var valor0 = table1.row(value).data()[0]; 
            var valor13 = table1.row(value).data()[17]; 
            var obs = $(value).find("td").eq(18).find("input").val(); 
            rowData.push(valor0);
            rowData.push(valor13 + " " + date + " OBS: " + obs + " |"); 
            idt.push(rowData); 
        });

        swal({
            title: "¡SAPMA!",
            text: "¿Desea agregar observación?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false      
            }, function(isConfirm) {
                if (isConfirm) {
                    $.ajax({
                        url: "/mensajerech",
                        type: "POST", 	 	
                        data: {
                            idt                            
                        },
                        beforeSend: function() {
                            swal({
                            title: "Agregado comentarios",
                            text: "Espere un momento por favor...",
                            imageUrl:"/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                            });
                        }
                        }).done(function (data) {
                            swal({
                                title: "¡SAPMA!",
                                text: "Comentarios agregados",
                                type: "success",
                                confirmButtonText: "Aceptar",
                                allowOutsideClick: false
                            });	
                            setTimeout(function () {
                                location.reload();
                            }, 1000);				
                    });
                } else {
                    swal("¡SAPMA!", "Observación descartada", "error");
                }
            }
                    
        );		
    });

    $("#aprob").on("click", function () {

        var fechaActual = new Date();
        var dia = fechaActual.getDate(); 
        var mes = fechaActual.getMonth() + 1; 
        var ano = fechaActual.getFullYear();
        var date = dia + "-" + mes + "-" + ano;

        var idt= [];

        var data = table1.rows({selected: true}).nodes();

        if(!data.length){
            swal("Error", "Debe seleccionar al menos una fila para aprobar","error");
            return;
        }

        $.each(data, function (index, value) {
            var rowData = [];
            var valor0 = table1.row(value).data()[0]; 
            var valor13 = table1.row(value).data()[17]; 
            var obs = $(value).find("td").eq(18).find("input").val(); 
            rowData.push(valor0);
            rowData.push(valor13 + " " + date + " OBS: " + obs + " |"); 
            idt.push(rowData); 
        });

        swal({
            title: "¡SAPMA!",
            text: "¿Desea aprobar estas tareas?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false      
            }, function(isConfirm) {
                if (isConfirm) {
                    $.ajax({
                        url: "/aprorech",
                        type: "POST", 	 	
                        data: {
                            idt           
                        },
                        beforeSend: function() {
                            swal({
                            title: "Aprobando",
                            text: "Espere un momento por favor...",
                            imageUrl:"/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                            });
                        }
                        }).done(function (data) {
                        swal({
                            title: "¡SAPMA!",
                            text: "Tareas aprobadas",
                            type: "success",
                            confirmButtonText: "Aceptar",
                            allowOutsideClick: false
                        });	
                        setTimeout(function () {
                            location.reload();
                        }, 1000);	                        
                    }); 
                } else {
                    swal("¡SAPMA!", "Tareas no aprobadas", "error");
                }
            }
            
        );		
    });

    $("#pdfs").on("click", function () {
        var rows_selected = table1.rows({selected: true}).data();
        var idpdf = [];
        var codigo = [];
        var ot = [];
        $.each(rows_selected, function (index, value) {
            idpdf.push(value[0]);
        });

        $.each(rows_selected, function (index, value) {
            ot.push(value[1]);
        });
  
        $.each(rows_selected, function (index, value) {
            codigo.push(value[5]);
        });
  
        $.ajax({
          url: "/pdfs",
          type: "POST",
          data: {
              idpdf,
              codigo,
              ot
          },
          beforeSend: function() {
              swal({
              title: "Generando PDFs",
              text: "Espere un momento por favor...",
              imageUrl:"/img/Spinner-1s-200px2.gif",
              showConfirmButton: false,
              allowOutsideClick: false
              });
          }
        }).done(function (data) {
          swal({
              title: "PDFs Generados",
              text: "Se han agregado los PDFs a un archivo comprimido",
              type: "success",
              confirmButtonText: "Aceptar",
              allowOutsideClick: false
          }, function (isConfirm) {
              if (isConfirm) {
                window.location.href = "/archivo";
              }
          });
        });
    });
  
    $("#pdfs1").on("click", function () {
        var rows_selected = table1.rows({selected: true}).data();
        var idpdf = [];
        var codigo= [];
        var ot= [];
        $.each(rows_selected, function (index, value) {
            idpdf.push(value[0]);
        });

        $.each(rows_selected, function (index, value) {
            ot.push(value[1]);
        });

        $.each(rows_selected, function (index, value) {
            codigo.push(value[5]);
        });
        window.location.href = "/archivo/" + idpdf + "/" + codigo + "/" + ot;		
    });
});