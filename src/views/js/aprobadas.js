
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
            "title": "TareasAprobadas",
            "titleAttr": "Exportar a Excel",
            "className": "btn btn-rounded btn-success",
            "exportOptions": {
              "columns": [0, 1, 2, 3, 4, 5, 6, 7, 8,9,10,11,12],
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
                    <button id="seleccionar" type="button" class="btn btn-inline btn-warning ladda-button" disabled>Seleccionar</i></button>
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
          
          if (rowData[13] === "") {
              e.preventDefault();
          }
      });

      var filasSeleccionadasPorSeleccionar = []; 

      $('#seleccionar').on('click', function () {
          var filasSeleccionadasPorSeleccionar = table1.rows(function (idx, data, node) {
              return data[13] !== "";
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
              return data[13] !== "";
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

    $('#filt').on('click', function() {

      var date1 = $('#date1').val();
      var date2 = $('#date2').val();
      var tarea = $('#tarea').val();
      var ot = $('#ot').val();

      if ((tarea && (date1 || date2)) || (date1 && date2 && tarea)) {
          swal("Error", "No puede enviar fechas y tarea.", "error");
          $('#date1').val('');
          $('#date2').val('');
          $('#tarea').val('');
          $('#ot').val('');
          return;
      }

      if ((ot && (date1 || date2)) || (date1 && date2 && ot)) {
          swal("Error", "No puede enviar fechas y OT.", "error");
          $('#date1').val('');
          $('#date2').val('');
          $('#tarea').val('');
          $('#ot').val('');
          return;
      }

      if (tarea && ot) {
          swal("Error", "No puede enviar tarea y OT.", "error");
          $('#date1').val('');
          $('#date2').val('');
          $('#tarea').val('');
          $('#ot').val('');
          return;
      }
      
      if (!date1 && !date2 && !tarea && !ot) {
          swal("Error", "Seleccione un rango de fechas, ingrese una tarea o una ot.", "error");
          $('#date1').val('');
          $('#date2').val('');
          $('#tarea').val('');
          $('#ot').val('');
          return;
      }

      if ((!date1 && date2) || (date1 && !date2)) {
          swal("Error", "Seleccione ambas fechas.", "error");
          $('#date1').val('');
          $('#date2').val('');
          $('#tarea').val('');
          $('#ot').val('');
          return;
      }

      var data = {
        date1,
        date2,
        tarea,
        ot
      }
  
      swal({
          title: "Cargando",
          text: "Espere un momento por favor...",
          imageUrl: "/img/Spinner-1s-200px2.gif",
          showConfirmButton: false,
          allowOutsideClick: false
      });
  
      $.ajax({
        url: '/aprobadas',
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
                  <td>${item.IdTarea}</td>
                  <td>${item.OT === null ? '' : item.OT}</td>
                  <td>${item.FechaTarea}</td>
                  <td>${item.EstadoDesc}</td>
                  <td>${item.TipoServicio}</td>
                  <td>${item.EquipoCodigoTAG}</td>
                  <td>${item.GerenciaDesc}</td>
                  <td>${item.AreaDesc}</td>
                  <td>${item.SectorDesc}</td>
                  <td>${item.DetalleUbicacion}</td>
                  <td>${item.EstadoOperEquipo === null && (item.EstadoDesc === 'Terminada validada' || item.EstadoDesc === 'Terminada sin validar' ) ?
                  '***Error***' : item.EstadoOperEquipo === 'SOP' ? 'Sistema operativo' : 
                  item.EstadoOperEquipo === 'SC' ? 'No aplica':
                  item.EstadoOperEquipo === 'SSR' ? 'Sistema sin revisar':
                  item.EstadoOperEquipo === 'SOCO' ? 'Sist. operativo con obs.':
                  item.EstadoOperEquipo === 'SFS' ? 'Sist. fuera de serv.':
                  item.EstadoOperEquipo === 'SNO' ? 'Sist. no operativo':
                  item.EstadoOperEquipo === null ? '':
                  item.EstadoOperEquipo}</td>
                  <td>${item.EstadoOperEquipoObs === null ? '' : (item.EstadoOperEquipoObs === 'SC' ? '' : item.EstadoOperEquipoObs)}</td>
                  <td>${item.ValidacionObservacion}</td>
                  <td>
                      ${item.EstadoOperEquipo !== null ? 
                      `<center><a href="/protocolo/${item.IdTarea}" class="btn btn-inline btn-primary btn-sm ladda-button" target="_blank"><i class="fa fa-file-archive-o"></i></a></center>` : ''}
                  </td>
              </tr>
          `);
  
        });
      
        initDataTable();
        $('#seleccionar').prop('disabled', false);
  
      });

      $('#date1').val('');
      $('#date2').val('');
      $('#tarea').val('');
    
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
            confirmButtonText: "Descargar",
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
      window.location.href = "/archivo/" + idpdf + "/" + codigo + "/" +ot;		
    });

});