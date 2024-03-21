
var table1;
$(document).ready(function () {

    var date1 = document.querySelector('#date1');
    var date2 = document.querySelector('#date2');
    date1.addEventListener('change', function() {
        date2.min = this.value;
    });	
    
    function initDataTable() {
        var checkTogglePressed = false;
      
        table1 = $('#tabla_prot').DataTable({
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
              "title": "Tareas",
              "titleAttr": "Exportar a Excel",
              "className": "btn btn-rounded btn-success",
              "exportOptions": {
                "columns": [0, 1, 2, 3, 4, 5, 6, 7, 8],
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
                      <button id="seleccionar" type="button" class="btn btn-inline btn-secondary ladda-button">Seleccionar todo</i></button>
                      <button id="clearFilters" type="button" class="btn btn-inline btn-danger btn-sm ladda-button"><i class="fa fa-filter"></i></button>
                  </div>
                `);
          },
          "bDestroy": true,
          "scrollX": true,
          "bInfo": true,
          "iDisplayLength": 15,
          "autoWidth": true,
          "language": {
              "sProcessing": "Procesando...",
              "sLengthMenu": "Mostrar _MENU_ registros",
              "sZeroRecords": "No se encontraron resultados",
              "sEmptyTable": "Sin información",
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
  
        $('#parentSelect').append('<option value="" selected disabled>Seleccione una gerencia</option>');
        $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
        $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
        
        table1.column(3).data().unique().sort().each(function(value, index) {
          $('#parentSelect').append(
          '<option value="' + value + '">' + value + '</option>');
        });
  
        $('#parentSelect').on('change', function(e) {
          var selectedValue = $(this).val();
          table1.column(3).search(selectedValue).draw();
  
          $('#infoSelect').empty();
          $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
          table1.column(4, {search: 'applied'}).data().unique().sort().each(function(value, index) {
              $('#infoSelect').append('<option value="' + value + '">' + value + '</option>');
          });
        });
  
        $('#infoSelect').on('change', function(e) {
          var selectedParentValue = $('#parentSelect').val();
          var selectedInfoValue = $(this).val(); 
      
          table1.column(3).search(selectedParentValue).column(4).search(selectedInfoValue).draw();
      
          $('#subInfoSelect').empty(); 
          $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
          table1.column(5, {search: 'applied'}).data().unique().sort().each(function(value, index) {
              $('#subInfoSelect').append('<option value="' + value + '">' + value + '</option>');
          });
        });
  
        $('#subInfoSelect').on('change', function(e) {
          var selectedParentValue = $('#parentSelect').val();
          var selectedInfoValue = $('#infoSelect').val(); 
          var selectedSubInfoValue = $(this).val();
  
          table1.column(3).search(selectedParentValue);
          table1.column(4).search(selectedInfoValue);
          table1.column(5).search("^" + selectedSubInfoValue + "$", true, false);
  
          table1.draw();
        });
  
        $('#clearFilters').on('click', function() {
          $('#parentSelect').empty();
          $('#parentSelect').append('<option value="" selected disabled>Seleccione una gerencia</option>');
          table1.column(3).data().unique().sort().each(function(value, index) {
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
  
        $('#seleccionar').on('click', function () {
          var selectedRows = table1.rows({ selected: true }).count();
          var totalRows = table1.rows({ search: 'applied' }).count();
      
          if (selectedRows === totalRows && selectedRows > 0) {
              table1.rows({ search: 'applied' }).deselect();
              $(this).text('Seleccionar todo');
          } else {
              table1.rows({ search: 'applied' }).select();
              $(this).text('Borrar selección');
          }
        });
      
  
    }
  
    initDataTable(); 

    $('#filt').on('click', function() {

        var date1 = $('#date1').val();
        var date2 = $('#date2').val();
        var tarea = $('#tarea').val();

        if ((tarea && (date1 || date2)) || (date1 && date2 && tarea)) {
            swal("Error", "No puede enviar dates y tarea.", "error");
            return;
        }

        if (!date1 && !date2 && !tarea) {
            swal("Error", "Seleccione un rango de fechas o ingrese una tarea.", "error");
            return;
        }

        if ((!date1 && date2) || (date1 && !date2)) {
            swal("Error", "Seleccione ambas fechas.", "error");
            return;
        }

        var data = {
          date1,
          date2,
          tarea
        }
    
        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });
    
        $.ajax({
          url: '/protocoloss',
          type:'POST',
          data:data
        }).done(function(data){

          swal.close();
    
          if ($.fn.DataTable.isDataTable('#tabla_prot')) {
              table1.clear().destroy();
          }
    
          $('#tabla_prot tbody').empty();
    
          data.forEach(function (item) {
            $('#tabla_prot tbody').append(`
                <tr>
                    <td style="width: 8%">${item.IDT}</td>
                    <td style="width: 8%">${item.FECHA}</td>
                    <td style="width: 10%">${item.CODIGO}</td>
                    <td style="width: 10%">${item.GERENCIA}</td>
                    <td style="width: 15%">${item.AREA}</td>
                    <td style="width: 20%">${item.SECTOR}</td>
                    <td style="width: 15%">${item.SERVICIO}</td>
                    <td style="width: 15%">${item.ESTADO}</td>
                    <td>
                        ${item.ESTADO === 'Terminada validada' || item.ESTADO === 'Terminada sin validar' ? 
                        `<center><a href="/protocolo/${item.IDT}" class="btn btn-inline btn-primary btn-sm ladda-button" target="_blank"><i class="fa fa-file-archive-o"></i></a></center>` : ''}
                    </td>
                </tr>
            `);
    
          });
        
          initDataTable();
    
        });
    
    });

    $("#env_val").on("click", function () {
        var rows_selected = table1.rows({selected: true}).data();
        var idt = [];

        $.each(rows_selected, function (index, value) {
            idt.push(value[0]);
        });

        if(rows_selected.length === 0){
          swal("Error", "Debe seleccionar al menos una fila antes de enviar las tareas para aprobar.", "error");
          return;
        }
        
        swal({
        title: "¡SAPMA!",
        text: "¿Desea validar estas tareas?",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: false      
            }, function(isConfirm) {
                if (isConfirm) {
                    $.ajax({
                        url: "/protocolo/validar",
                        type: "POST",
                        data: {
                            idt
                        }
                    });
                    swal("¡SAPMA!", "Tareas validadas", "success");
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                } else {
                    swal("¡SAPMA!", "Tareas no validadas", "error");
                }
            } 
        );	
    });

    $("#pdfs").on("click", function () {
        var rows_selected = table1.rows({selected: true}).data();
        var idpdf = [];
        var codigo = [];
        $.each(rows_selected, function (index, value) {
            idpdf.push(value[0]);
        });

        $.each(rows_selected, function (index, value) {
            codigo.push(value[2]);
        });

        $.ajax({
            url: "/pdfs",
            type: "POST",
            data: {
                idpdf,
                codigo
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
    -
    $("#pdfs1").on("click", function () {
        var rows_selected = table1.rows({selected: true}).data();
        var idpdf = [];
        var codigo= [];
        $.each(rows_selected, function (index, value) {
            idpdf.push(value[0]);
        });

        $.each(rows_selected, function (index, value) {
            codigo.push(value[2]);
        });
            window.location.href = "/archivo/" + idpdf + "/" + codigo;		
    });

});



    // table = $('#tabla_prot').DataTable({
    //     'columnDefs': [
    //         {
    //             'targets': 0,
    //             'checkboxes': {
    //                 'selectRow': true
    //             }
    //         }
    //     ],
    //     'select': {
    //         'style': 'multi'
    //     },
    //     "dom": 'Bf<"filters">rtip',
    //     "searching": true,
    //     "lengthChange": false,
    //     "colReorder": true,
    //     "buttons": [
    //     {
    //         "extend": 'excelHtml5',
    //         "text": '<i class="fa fa-file-excel-o"></i>',
    //         "title": 'Protocolos',
    //         "titleAttr": 'Exportar a Excel',
    //         "className": 'btn btn-rounded btn-success',
    //         "exportOptions": {
    //         "columns": [1, 2, 3, 4, 5, 6, 7, 8, 9]
    //         },
    //         customize: function(xlsx) {
    //         const sheet = xlsx.xl.worksheets['sheet1.xml'];
    //             $('row:first c', sheet).attr('s', '47');
    //         }
    //     }],
    //     initComplete: function() {
    //     $('.filters').html(`
    //         <style>
    //         #parentFilter {
    //         float: left;
    //         margin-left: 15px;
    //         }

    //         #parentSelect {
    //         height: 38px;
    //         width: 100%;
    //         border: 1px solid rgb(227, 227, 227);
    //         border-radius: 4px;
    //         }

    //         #infoFilter {
    //         float: left;
    //         margin-left: 15px;
    //         }

    //         #infoSelect {
    //         height: 38px;
    //         width: 100%;
    //         border: 1px solid rgb(227, 227, 227);
    //         border-radius: 4px;
    //         }

    //         #subInfoFilter {
    //         float: left;
    //         margin-left: 15px;
    //         }

    //         #subInfoSelect {
    //         height: 38px;
    //         width: 100%;
    //         border: 1px solid rgb(227, 227, 227);
    //         border-radius: 4px;
    //         }

    //         @media (max-width: 768px) {
    //         #parentFilter,
    //         #infoFilter,
    //         #subInfoFilter {
    //             float: none;
    //             margin-left: 0;
    //         }

    //         #parentSelect,
    //         #infoSelect,
    //         #subInfoSelect {
    //             width: 100%;
    //         }
    //         }
    //         </style>			
    //         <div>
    //             <div id="parentFilter">
    //                 <select id="parentSelect" width: 50%;>
    //                 </select>
    //             </div>
    //             <div id="infoFilter">
    //                 <select id="infoSelect" width: 50%;>
    //                 </select>
    //             </div>
    //             <div id="subInfoFilter">
    //                 <select id="subInfoSelect" width: 50%;">
    //                 </select>
    //             </div>
    //         </div>
    //     `);
    //     },
    //     "bDestroy": true, 	
    //     "scrollX": true,
    //     "fixedColumns":   {
    //         "leftColumns": 4//Le indico que deje fijas solo las 2 primeras columnas
    //     },
    //     "bInfo": true,
    //     "iDisplayLength": 20,
    //     "autoWidth": true,
    //     "language": {
    //         "sProcessing": "Procesando...",
    //         "sLengthMenu": "Mostrar _MENU_ registros",
    //         "sZeroRecords": "No se encontraron resultados",
    //         "sEmptyTable": "Ningún dato disponible en esta tabla",
    //         "sInfo": "Mostrando un total de _TOTAL_ registros",
    //         "sInfoEmpty": "Mostrando un total de 0 registros",
    //         "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
    //         "sInfoPostFix": "",
    //         "sSearch": "Buscar:",
    //         "sUrl": "",
    //         "sInfoThousands": ".",
    //         "sLoadingRecords": "Cargando...",
    //         "oPaginate": {
    //             "sFirst": "Primero",
    //             "sLast": "Último",
    //             "sNext": "Siguiente",
    //             "sPrevious": "Anterior"
    //         },
    //         "oAria": {
    //             "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
    //             "sSortDescending": ": Activar para ordenar la columna de manera descendente"
    //         },
    //         "select" : {
    //             "rows" : {
    //                 "_" : "Has seleccionado %d filas",
    //                 "0" : "Click en una fila para seleccionar",
    //                 "1" : "Has seleccionado 1 fila"
    //             }
    //         }
    //     },
    // }).on( 'select.dt deselect.dt', function ( e, dt, type, indexes ) {	
    //     var count = table.rows( { selected: true } ).count();
    //     if (count > 0) {
    //         $("#env_val").prop("disabled", false);
    //         $("#pdfs").prop("disabled", false);
            
    //     } else {
    //         $("#env_val").prop("disabled", true);
    //         $("#pdfs").prop("disabled", true);
    //     }

    //     if (count === 1) {
    //         $("#pdfs1").prop("hidden", false);
    //         $("#pdfs").prop("hidden", true);
    //     } else if (count > 1) {
    //         $("#pdfs").prop("hidden", false);
    //         $("#pdfs1").prop("hidden", true);
    //     } else {
    //         $("#pdfs").prop("hidden", true);
    //         $("#pdfs1").prop("hidden", true);
    //     }
    // }).columns.adjust();

    // var pro = table.column(8).data();
    
    // pro.each(function(value, index) {
    //     if (value === "No Realizada") {
    //         var row = table.row(index).node();
    //         $(row).find("td:eq(9) a").remove();
    //     }
    // });

    // var rowsSelectable = false;

    // table.on('select', function(e, dt, type, indexes) {
    //     if (type === 'row' && !rowsSelectable) {
    //         var data = table.rows(indexes).data().toArray();
    //         if (data[0][8] === 'No Realizada') {
    //             table.rows(indexes).deselect();
    //         }
    //     }
    // });

    // var parentValues = table.column(4).data().unique();
    // parentValues.sort();
    // $('#parentFilter select').append('<option value="">Seleccione una gerencia</option>');
    // parentValues.each(function(value) {
    //     $('#parentFilter select').append('<option value="' + value + '">' + value + '</option>');
    //     table.on('draw.dt', function() {
    //         table.rows().deselect();
    //     });
    // });
    // $('#parentFilter select').on('change', function() {
    //     var selectedParent = $(this).val();
    //     if (!selectedParent) {
    //         table.search('').columns().search('').draw();
    //         $('#infoFilter select').empty();
    //         $('#subInfoFilter select').empty();
    //         return;
    //     }
    //     table.column(4).search(selectedParent).draw();
    //     $('#infoFilter select').empty();
    //     $('#subInfoFilter select').empty();
    //     var infoValues = table
    //         .column(5)
    //         .data()
    //         .filter(function(value, index) {
    //             return table.column(4).data()[index] === selectedParent;
    //         })
    //         .unique();
    //     infoValues.sort();
    //     $('#infoFilter select').append('<option value="">Selecciones un área</option>');
    //     infoValues.each(function(value) {
    //         $('#infoFilter select').append('<option value="' + value + '">' + value + '</option>');
    //     });
    //     table.on('draw.dt', function() {
    //         table.rows().deselect();
    //     });
    // });
    // $('#infoFilter select').on('change', function() {
    //     var selectedInfo = $(this).val();
    //     if (!selectedInfo) {
    //         table.column(4).search($('#parentFilter select').val()).draw();
    //         $('#subInfoFilter select').empty();
    //         return;
    //     }
    //     table.column(5).search(selectedInfo).draw();
    //     $('#subInfoFilter select').empty();
    //     var subInfoValues = table
    //         .column(6)
    //         .data()
    //         .filter(function(value, index) {
    //             return (
    //                 table.column(4).data()[index] === $('#parentFilter select').val() &&
    //                 table.column(5).data()[index] === selectedInfo
    //             );
    //         })
    //         .unique();
    //     subInfoValues.sort();				
    //     subInfoValues.each(function(value) {
    //         $('#subInfoFilter select').append('<option value="' + value + '">' + value + '</option>');
    //     });
    //     table.on('draw.dt', function() {
    //         table.rows().deselect();
    //     });
    // });
    // $('#subInfoFilter select').on('change', function() {
    //     var selectedSubInfo = $(this).val();
    //     if (!selectedSubInfo) {
    //         table.column(5).search($('#infoFilter select').val()).draw();
    //         return;
    //     }
    //     table.column(6).search(selectedSubInfo).draw();
    //     table.on('draw.dt', function() {
    //         table.rows().deselect();
    //     });
    // });
    