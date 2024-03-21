var table1;
$(document).ready(function () {

  $('#date3').change(function() {
    var year = $(this).val(); 

    $.ajax({
        url: '/fuente_mesg/' + year,
        type: 'GET',
        success: function(response) {

            $('#date4').empty();

            $('#date4').append('<option value="" disabled selected>Seleccione un mes</option>');
            $.each(response, function(index, month) {
                var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                $('#date4').append('<option value="' + month + '">' + monthNames[parseInt(month) - 1] + '</option>');
            });
        },
        error: function(error) {
            console.log(error);
        }
    });
  });

  function initDataTable() {
      var checkTogglePressed = false;
    
      table1 = $('#tabla_prot1').DataTable({
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
              "columns": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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
      
      table1.column(4).data().unique().sort().each(function(value, index) {
        $('#parentSelect').append(
        '<option value="' + value + '">' + value + '</option>');
      });

      $('#parentSelect').on('change', function(e) {
        var selectedValue = $(this).val();
        table1.column(4).search(selectedValue).draw();

        $('#infoSelect').empty();
        $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
        table1.column(5, {search: 'applied'}).data().unique().sort().each(function(value, index) {
            $('#infoSelect').append('<option value="' + value + '">' + value + '</option>');
        });
      });

      $('#infoSelect').on('change', function(e) {
        var selectedParentValue = $('#parentSelect').val();
        var selectedInfoValue = $(this).val(); 
    
        table1.column(4).search(selectedParentValue).column(5).search(selectedInfoValue).draw();
    
        $('#subInfoSelect').empty(); 
        $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
        table1.column(6, {search: 'applied'}).data().unique().sort().each(function(value, index) {
            $('#subInfoSelect').append('<option value="' + value + '">' + value + '</option>');
        });
      });

      $('#subInfoSelect').on('change', function(e) {
        var selectedParentValue = $('#parentSelect').val();
        var selectedInfoValue = $('#infoSelect').val(); 
        var selectedSubInfoValue = $(this).val();

        table1.column(4).search(selectedParentValue);
        table1.column(5).search(selectedInfoValue);
        table1.column(6).search("^" + selectedSubInfoValue + "$", true, false);

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
    
      var rowsSelectable = false;

      table1.on("select", function (e, dt, type, indexes) {
        if (type === "row" && !rowsSelectable) {
          var data = table1.rows(indexes).data().toArray();
          if (
            data[0][8] === "Descargada" ||
            data[0][8] === "Anulada" ||
            data[0][8] === "Planificada" ||
            data[0][8] === "No Realizada" ||
            data[0][8] === "Archivada" ||
            (data[0][8] === "Terminada validada" & data[0][9] === "ERROR")
          ) {
            table1.rows(indexes).deselect();
          }
        }
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

      var state = false;
  
      $("#check-toggle-1").on("click", function () {
        rowsSelectable = !rowsSelectable;
        table1.rows(".selected").deselect();
        checkTogglePressed = !checkTogglePressed;
        if (state) {
          $("#check-toggle-3").prop("disabled", false);
          $("#check-toggle-4").prop("disabled", false);
          $("#anular1").prop("hidden", true);
          $("#second-div").hide();
          $("#anula_todo").show();
          $("#anula_ex").show();
        } else {
          $("#check-toggle-3").prop("disabled", true);
          $("#check-toggle-4").prop("disabled", true);
          $("#anula_todo").hide();
          $("#anula_ex").hide();
          $("#anular1").prop("hidden", false);
          $("#pdfs1").prop("hidden", true);
          $("#pdfs").prop("hidden", true);
          $("#second-div").show();
        }
        state = !state;
      });

      var state1 = false;

      $("#check-toggle-3").on("click", function () {
        if (state1) {
          $("#check-toggle-1").prop("disabled", false);
          $("#tabla_prot11").show();
          $("#form_todo").hide();
          $("#anula_lista").prop("hidden", true);
          $("#check-toggle-4").prop("disabled", false);
        } else {
          $("#check-toggle-1").prop("disabled", true);
          $("#check-toggle-4").prop("disabled", true);
          $("#tabla_prot11").hide();
          $("#form_todo").show();
          $("#anula_lista").prop("hidden", false);
        }
  
        state1 = !state1;
      });
  
      var state2 = false;
  
      $("#check-toggle-4").on("click", function () {
        if (state2) {
          $("#check-toggle-1").prop("disabled", false);
          $("#tabla_prot11").show();
          $("#form_todo").hide();
          $("#form_ex").hide();
          $("#check-toggle-3").prop("disabled", false);
          $("#anular2").prop("hidden", true);
          $("#excel").prop("hidden", true);
        } else {
          $("#check-toggle-1").prop("disabled", true);
          $("#check-toggle-3").prop("disabled", true);
          $("#form_ex").show();
          $("#tabla_prot11").hide();
          $("#anular2").prop("hidden", false);
          $("#excel").prop("hidden", false);
        }
  
        state2 = !state2;
      });

      function moveDuplicatesToTop(columnIndex) {
        var table = $('#tabla_prot1').DataTable();
        var rows = table.rows().nodes().toArray(); 
      
        var data = table.column(columnIndex).data();
        var uniqueValues = [];
        var duplicatedValues = [];
      
        data.each(function(value, index) {
          if (uniqueValues.indexOf(value) === -1) {
            uniqueValues.push(value);
          } else {
            duplicatedValues.push(value);
          }
        });
      
        rows.forEach(function(row) {
          var rowData = table.row(row).data();
          var cellValue = rowData[columnIndex];
          if (duplicatedValues.includes(cellValue)) {
            $(row).insertBefore(table.rows().nodes()[0]);
            $(row).addClass('text-danger'); 
          }
        });
      }

      moveDuplicatesToTop(2);
      
  }

  initDataTable(); 

  $('#buscar').on('click', function() {
    
    var date3 = $('#date3').val();
    var date4 = $('#date4').val();
    var tarea = $('#tarea').val();

    if(!date3 & !date4 & !tarea){
      swal("Error", "Seleccione año y mes o ingrese una tarea.", "error");
      return;
    }

    if(!date3 & date4){
      swal("Error", "Seleccione año y mes.", "error");
      return;
    }

    var data = {
      date3,
      date4,
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
      url: '/tgenerales',
      type:'POST',
      data:data
    }).done(function(data){
      
      swal.close();

      if ($.fn.DataTable.isDataTable('#tabla_prot1')) {
          table1.clear().destroy();
      }

      $('#tabla_prot1 tbody').empty();

      data.forEach(function (item) {
        $('#tabla_prot1 tbody').append(`
            <tr>
                <td>${item.IDT}</td>
                <td>${item.FECHA}</td>
                <td>${item.CODIGO}</td>
                <td>${item.TECNICO}</td>
                <td>${item.GERENCIA}</td>
                <td>${item.AREA}</td>
                <td>${item.SECTOR}</td>
                <td>${item.SERVICIO}</td>
                <td>${item.ESTADO}</td>
                <td>${item.ESTADO_EQUIPO === null  & item.ESTADO === 'Terminada validada' ? 'ERROR' : item.ESTADO_EQUIPO}</td>
                <td>${item.OBSERVACION_ESTADO === null ? '' : item.OBSERVACION_ESTADO}</td>
                <td>
                    ${item.ESTADO === 'Terminada validada' || item.ESTADO === 'Terminada sin validar' ? 
                    (item.ESTADO_EQUIPO === null ? '' : `<center><a href="/protocolo/${item.IDT}" class="btn btn-inline btn-primary btn-sm ladda-button" target="_blank"><i class="fa fa-file-archive-o"></i></a></center>`) : ''}
                </td>
            </tr>
        `);
      });
    
    
      initDataTable();

    });

  });

  $("#anular1").on("click", function () {
    var rows_selected = table1.rows({ selected: true }).data();
    if (rows_selected.length > 0) {
      var datos = [];
      $.each(rows_selected, function (index, value) {
        datos.push({
          idt: value[1],
          fecha: value[2],
          codigo: value[3],
          ger: value[4],
          area: value[5],
          sector: value[6],
          servicio: value[7],
        });
      });
      swal(
        {
          title: "¡SAPMA!",
          text: "¿Desea anular estas tareas?",
          type: "input",
          inputPlaceholder: "Ingrese su comentario aquí",
          showCancelButton: true,
          confirmButtonClass: "btn-primary",
          confirmButtonText: "Si",
          cancelButtonText: "No",
          closeOnConfirm: false,
        },
        function (inputValue) {
          if (inputValue !== false) {
            $.ajax({
              url: "/anular",
              type: "POST",
              data: {
                datos,
                comentario: inputValue || "TAREA ANULADA - AJUSTE INTERN0",
              },
            });
            swal("¡SAPMA!", "Tareas anuladas", "success");
            setTimeout(function () {
              location.reload();
            }, 1000);
          } else {
            swal("¡SAPMA!", "Tareas no anuladas", "error");
          }
        }
      );
    } else {
      swal("Error", "Debe seleccionar alguna fila para anular", "error");
    }
  });

  $("#anular2").on("click", function () {
    const input = document.querySelector("#file-input");
    const file = input.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      swal(
        {
          title: "¡SAPMA!",
          text: "¿Desea anular estas tareas?",
          type: "input",
          inputPlaceholder: "Ingrese su comentario aquí",
          showCancelButton: true,
          confirmButtonClass: "btn-primary",
          confirmButtonText: "Si",
          cancelButtonText: "No",
          closeOnConfirm: false,
        },
        function (inputValue) {
          if (inputValue !== false) {
            formData.append(
              "comentario",
              inputValue || "TAREA ANULADA - AJUSTE INTERN0"
            );
            $.ajax({
              url: "/anular_ex",
              type: "POST",
              data: formData,
              processData: false,
              contentType: false,
            });
            swal("¡SAPMA!", "Tareas anuladas", "success");
            setTimeout(function () {
              location.reload();
            }, 1000);
          } else {
            swal("¡SAPMA!", "Tareas no anuladas", "error");
          }
        }
      );
    } else {
      swal("Error", "Por favor seleccione un archivo", "error");
    }
  });

  $("#anula_lista").on("click", function () {
    var textareaValue = $("#tareas_lista").val().trim();
    var numbers = textareaValue.split(",");
    if (/^\d+,\d+(,\d+)*$/.test(textareaValue)) {
      var uniqueNumbers = {};
      var hasDuplicates = false;
      for (var i = 0; i < numbers.length; i++) {
        if (uniqueNumbers[numbers[i]]) {
          hasDuplicates = true;
          break;
        } else {
          uniqueNumbers[numbers[i]] = true;
        }
      }
      if (!hasDuplicates) {
        swal(
          {
            title: "¡SAPMA!",
            text: "¿Desea anular estas tareas?",
            type: "input",
            inputPlaceholder: "Ingrese su comentario aquí",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
          },
          function (inputValue) {
            if (inputValue !== false) {
              $.ajax({
                url: "/anular_lista",
                type: "POST",
                data: {
                  numbers: numbers,
                  comentario: inputValue || "TAREA ANULADA - AJUSTE INTERN0",
                },
              });
              swal("¡SAPMA!", "Tareas anuladas", "success");
              setTimeout(function () {
                location.reload();
              }, 1000);
            } else {
              swal("¡SAPMA!", "Tareas no anuladas", "error");
            }
          }
        );
      } else {
        swal("Error", "Por favor no ingreses números repetidos", "error");
      }
    } else {
      swal(
        "Error",
        "Por favor ingresa al menos dos números separados por comas, sin coma en el último número",
        "error"
      );
    }
  });

  const button = document.querySelector("#excel");
  button.addEventListener("click", () => {
    window.location.href = "/download";
  });

  $("#pdfs").on("click", function () {
    var rows_selected = table1.rows({ selected: true }).data();
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
        codigo,
      },
      beforeSend: function () {
        swal({
          title: "Generando PDFs",
          text: "Espere un momento por favor...",
          imageUrl: "/img/Spinner-1s-200px2.gif",
          showConfirmButton: false,
          allowOutsideClick: false,
        });
      },
    }).done(function (data) {
      swal(
        {
          title: "PDFs Generados",
          text: "Se han agregado los PDFs a un archivo comprimido",
          type: "success",
          confirmButtonText: "Aceptar",
          allowOutsideClick: false,
        },
        function (isConfirm) {
          if (isConfirm) {
            window.location.href = "/archivo";
          }
        }
      );
    });
  });

  $("#pdfs1").on("click", function () {
    var rows_selected = table1.rows({ selected: true }).data();
    var idpdf = [];
    var codigo = [];
    $.each(rows_selected, function (index, value) {
      idpdf.push(value[0]);
    });

    $.each(rows_selected, function (index, value) {
      codigo.push(value[2]);
    });
    window.location.href = "/archivo/" + idpdf + "/" + codigo;
  });
});

  // var checkTogglePressed = false;
  // table = $("#tabla_prot")
  //   .DataTable({
  //     columnDefs: [
  //       {
  //         targets: 0,
  //         checkboxes: {
  //           selectRow: true,
  //           selectAll: false,
  //         },
  //       },
  //     ],
  //     select: {
  //       style: "multi",
  //     },
  //     dom: 'Bf<"filters">rtip',
  //     searching: true,
  //     lengthChange: false,
  //     colReorder: true,
  //     buttons: [
  //       {
  //         extend: "excelHtml5",
  //         text: '<i class="fa fa-file-excel-o"></i>',
  //         title: "Tareas",
  //         titleAttr: "Exportar a Excel",
  //         className: "btn btn-rounded btn-success",
  //         exportOptions: {
  //           columns: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  //         },
  //         customize: function (xlsx) {
  //           const sheet = xlsx.xl.worksheets["sheet1.xml"];
  //           $("row:first c", sheet).attr("s", "47");
  //         },
  //       },
  //     ],
  //     initComplete: function () {
  //       $(".filters").html(`
  //               <style>
  //               #parentFilter {
  //               float: left;
  //               margin-left: 15px;
  //               }

  //               #parentSelect {
  //               height: 38px;
  //               width: 100%;
  //               border: 1px solid rgb(227, 227, 227);
  //               border-radius: 4px;
  //               }

  //               #infoFilter {
  //               float: left;
  //               margin-left: 15px;
  //               }

  //               #infoSelect {
  //               height: 38px;
  //               width: 100%;
  //               border: 1px solid rgb(227, 227, 227);
  //               border-radius: 4px;
  //               }

  //               #subInfoFilter {
  //               float: left;
  //               margin-left: 15px;
  //               }

  //               #subInfoSelect {
  //               height: 38px;
  //               width: 100%;
  //               border: 1px solid rgb(227, 227, 227);
  //               border-radius: 4px;
  //               }

  //               @media (max-width: 768px) {
  //               #parentFilter,
  //               #infoFilter,
  //               #subInfoFilter {
  //                   float: none;
  //                   margin-left: 0;
  //               }

  //               #parentSelect,
  //               #infoSelect,
  //               #subInfoSelect {
  //                   width: 100%;
  //               }
  //               }
  //               </style>			
  //               <div>
  //                   <div id="parentFilter">
  //                       <select id="parentSelect" width: 50%;>
  //                       </select>
  //                   </div>
  //                   <div id="infoFilter">
  //                       <select id="infoSelect" width: 50%;>
  //                       </select>
  //                   </div>
  //                   <div id="subInfoFilter">
  //                       <select id="subInfoSelect" width: 50%;">
  //                       </select>
  //                   </div>
  //               </div>
  //           `);
  //     },
  //     drawCallback: function () {
  //       // Especifico el índice de la columna en la que deseo buscar valores duplicados
  //       var indiceColumna = 3;

  //       // Creo un objeto para almacenar los valores de la columna especificada
  //       var valoresColumna = {};

  //       // Recorro las filas de la tabla
  //       this.api()
  //         .rows()
  //         .every(function () {
  //           // Obtiego el valor de la celda en la columna especificada
  //           var celda = this.cell(this.index(), indiceColumna).node();
  //           var valorCelda = $(celda).text();

  //           // Verific0 si el valor ya existe en el objeto "valoresColumna"
  //           if (valorCelda in valoresColumna) {
  //             // Si el valor ya existe, cambi0 el color de las letras de ambas filas a rojo
  //             $(celda).closest("tr").find("td").css("color", "red");
  //             $(valoresColumna[valorCelda])
  //               .closest("tr")
  //               .find("td")
  //               .css("color", "red");
  //           } else {
  //             // Si el valor no existe, se agrega al objeto "valoresColumna"
  //             valoresColumna[valorCelda] = celda;
  //           }
  //         });
  //     },
  //     bDestroy: true,
  //     scrollX: true,
  //     fixedColumns: {
  //       leftColumns: 4, //Le indico que deje fijas solo las 2 primeras columnas
  //     },
  //     bInfo: true,
  //     iDisplayLength: 20,
  //     autoWidth: true,
  //     language: {
  //       sProcessing: "Procesando...",
  //       sLengthMenu: "Mostrar _MENU_ registros",
  //       sZeroRecords: "No se encontraron resultados",
  //       sEmptyTable: "Ningún dato disponible en esta tabla",
  //       sInfo: "Mostrando un total de _TOTAL_ registros",
  //       sInfoEmpty: "Mostrando un total de 0 registros",
  //       sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
  //       sInfoPostFix: "",
  //       sSearch: "Buscar:",
  //       sUrl: "",
  //       sInfoThousands: ".",
  //       sLoadingRecords: "Cargando...",
  //       oPaginate: {
  //         sFirst: "Primero",
  //         sLast: "Último",
  //         sNext: "Siguiente",
  //         sPrevious: "Anterior",
  //       },
  //       oAria: {
  //         sSortAscending:
  //           ": Activar para ordenar la columna de manera ascendente",
  //         sSortDescending:
  //           ": Activar para ordenar la columna de manera descendente",
  //       },
  //       select: {
  //         rows: {
  //           _: "Has seleccionado %d filas",
  //           0: "Click en una fila para seleccionar",
  //           1: "Has seleccionado 1 fila",
  //         },
  //       },
  //     },
  //   })
  //   .on("select.dt deselect.dt", function (e, dt, type, indexes) {
  //     var count = table.rows({ selected: true }).count();
  //     if (!checkTogglePressed) {
  //       if (count > 0) {
  //         $("#pdfs").prop("disabled", false);
  //       } else {
  //         $("#pdfs").prop("disabled", true);
  //       }

  //       if (count === 1) {
  //         $("#pdfs1").prop("hidden", false);
  //         $("#pdfs").prop("hidden", true);
  //       } else if (count > 1) {
  //         $("#pdfs").prop("hidden", false);
  //         $("#pdfs1").prop("hidden", true);
  //       } else {
  //         $("#pdfs").prop("hidden", true);
  //         $("#pdfs1").prop("hidden", true);
  //       }
  //     }
  //   })
  //   .columns.adjust();

  // var rowsSelectable = false;

  // table.on("select", function (e, dt, type, indexes) {
  //   if (type === "row" && !rowsSelectable) {
  //     var data = table.rows(indexes).data().toArray();
  //     if (
  //       data[0][9] === "Descargada" ||
  //       data[0][9] === "Anulada" ||
  //       data[0][9] === "Planificada" ||
  //       data[0][9] === "No Realizada" ||
  //       data[0][9] === "Archivada"
  //     ) {
  //       table.rows(indexes).deselect();
  //     }
  //   }
  // });



  // var parentValues = table.column(5).data().unique();
  // parentValues.sort();
  // $("#parentFilter select").append(
  //   '<option value="">Seleccione una gerencia</option>'
  // );

  // parentValues.each(function (value) {
  //   $("#parentFilter select").append(
  //     '<option value="' + value + '">' + value + "</option>"
  //   );
  //   table.on("draw.dt", function () {
  //     table.rows().deselect();
  //   });
  // });

  // $("#parentFilter select").on("change", function () {
  //   var selectedParent = $(this).val();
  //   if (!selectedParent) {
  //     table.search("").columns().search("").draw();
  //     $("#infoFilter select").empty();
  //     $("#subInfoFilter select").empty();
  //     return;
  //   }
  //   table.column(5).search(selectedParent).draw();
  //   $("#infoFilter select").empty();
  //   $("#subInfoFilter select").empty();
  //   var infoValues = table
  //     .column(6)
  //     .data()
  //     .filter(function (value, index) {
  //       return table.column(5).data()[index] === selectedParent;
  //     })
  //     .unique();
  //   infoValues.sort();
  //   $("#infoFilter select").append(
  //     '<option value="">Selecciones un área</option>'
  //   );
  //   infoValues.each(function (value) {
  //     $("#infoFilter select").append(
  //       '<option value="' + value + '">' + value + "</option>"
  //     );
  //   });
  //   table.on("draw.dt", function () {
  //     table.rows().deselect();
  //   });
  // });

  // $("#infoFilter select").on("change", function () {
  //   var selectedInfo = $(this).val();
  //   if (!selectedInfo) {
  //     table.column(5).search($("#parentFilter select").val()).draw();
  //     $("#subInfoFilter select").empty();
  //     return;
  //   }
  //   table.column(6).search(selectedInfo).draw();
  //   $("#subInfoFilter select").empty();
  //   var subInfoValues = table
  //     .column(7)
  //     .data()
  //     .filter(function (value, index) {
  //       return (
  //         table.column(5).data()[index] === $("#parentFilter select").val() &&
  //         table.column(6).data()[index] === selectedInfo
  //       );
  //     })
  //     .unique();
  //   subInfoValues.sort();
  //   subInfoValues.each(function (value) {
  //     $("#subInfoFilter select").append(
  //       '<option value="' + value + '">' + value + "</option>"
  //     );
  //   });
  //   table.on("draw.dt", function () {
  //     table.rows().deselect();
  //   });
  // });

  // $("#subInfoFilter select").on("change", function () {
  //   var selectedSubInfo = $(this).val();
  //   if (!selectedSubInfo) {
  //     table.column(6).search($("#infoFilter select").val()).draw();
  //     return;
  //   }
  //   table.column(7).search(selectedSubInfo).draw();
  //   table.on("draw.dt", function () {
  //     table.rows().deselect();
  //   });
  // });
  

