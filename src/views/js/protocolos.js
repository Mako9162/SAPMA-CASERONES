
var table;
$(document).ready(function () {
    var date1 = document.querySelector('#date1');
    var date2 = document.querySelector('#date2');
    date1.addEventListener('change', function() {
        date2.min = this.value;
    });		
    table = $('#tabla_prot').DataTable({
        'columnDefs': [
            {
                'targets': 0,
                'checkboxes': {
                    'selectRow': true
                }
            }
        ],
        'select': {
            'style': 'multi'
        },
        "dom": 'Bf<"filters">rtip',
        "searching": true,
        "lengthChange": false,
        "colReorder": true,
        "buttons": [
        {
            "extend": 'excelHtml5',
            "text": '<i class="fa fa-file-excel-o"></i>',
            "title": 'Protocolos',
            "titleAttr": 'Exportar a Excel',
            "className": 'btn btn-rounded btn-success',
            "exportOptions": {
            "columns": [1, 2, 3, 4, 5, 6, 7, 8, 9]
            },
            customize: function(xlsx) {
            const sheet = xlsx.xl.worksheets['sheet1.xml'];
                $('row:first c', sheet).attr('s', '47');
            }
        }],
        initComplete: function() {
        $('.filters').html(`
            <style>
            #parentFilter {
            float: left;
            margin-left: 15px;
            }

            #parentSelect {
            height: 38px;
            width: 100%;
            border: 1px solid rgb(227, 227, 227);
            border-radius: 4px;
            }

            #infoFilter {
            float: left;
            margin-left: 15px;
            }

            #infoSelect {
            height: 38px;
            width: 100%;
            border: 1px solid rgb(227, 227, 227);
            border-radius: 4px;
            }

            #subInfoFilter {
            float: left;
            margin-left: 15px;
            }

            #subInfoSelect {
            height: 38px;
            width: 100%;
            border: 1px solid rgb(227, 227, 227);
            border-radius: 4px;
            }

            @media (max-width: 768px) {
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
            </div>
        `);
        },
        "bDestroy": true, 	
        "scrollX": true,
        "fixedColumns":   {
            "leftColumns": 4//Le indico que deje fijas solo las 2 primeras columnas
        },
        "bInfo": true,
        "iDisplayLength": 20,
        "autoWidth": true,
        "language": {
            "sProcessing": "Procesando...",
            "sLengthMenu": "Mostrar _MENU_ registros",
            "sZeroRecords": "No se encontraron resultados",
            "sEmptyTable": "Ningún dato disponible en esta tabla",
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
        },
    }).on( 'select.dt deselect.dt', function ( e, dt, type, indexes ) {	
        var count = table.rows( { selected: true } ).count();
        if (count > 0) {
            $("#env_val").prop("disabled", false);
            $("#pdfs").prop("disabled", false);
            
        } else {
            $("#env_val").prop("disabled", true);
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
    }).columns.adjust();

    var pro = table.column(8).data();
    
    pro.each(function(value, index) {
        if (value === "No Realizada") {
            var row = table.row(index).node();
            $(row).find("td:eq(9) a").remove();
        }
    });

    var rowsSelectable = false;

    table.on('select', function(e, dt, type, indexes) {
        if (type === 'row' && !rowsSelectable) {
            var data = table.rows(indexes).data().toArray();
            if (data[0][8] === 'No Realizada') {
                table.rows(indexes).deselect();
            }
        }
    });

    var parentValues = table.column(4).data().unique();
    parentValues.sort();
    $('#parentFilter select').append('<option value="">Seleccione una gerencia</option>');
    parentValues.each(function(value) {
        $('#parentFilter select').append('<option value="' + value + '">' + value + '</option>');
        table.on('draw.dt', function() {
            table.rows().deselect();
        });
    });
    $('#parentFilter select').on('change', function() {
        var selectedParent = $(this).val();
        if (!selectedParent) {
            table.search('').columns().search('').draw();
            $('#infoFilter select').empty();
            $('#subInfoFilter select').empty();
            return;
        }
        table.column(4).search(selectedParent).draw();
        $('#infoFilter select').empty();
        $('#subInfoFilter select').empty();
        var infoValues = table
            .column(5)
            .data()
            .filter(function(value, index) {
                return table.column(4).data()[index] === selectedParent;
            })
            .unique();
        infoValues.sort();
        $('#infoFilter select').append('<option value="">Selecciones un área</option>');
        infoValues.each(function(value) {
            $('#infoFilter select').append('<option value="' + value + '">' + value + '</option>');
        });
        table.on('draw.dt', function() {
            table.rows().deselect();
        });
    });
    $('#infoFilter select').on('change', function() {
        var selectedInfo = $(this).val();
        if (!selectedInfo) {
            table.column(4).search($('#parentFilter select').val()).draw();
            $('#subInfoFilter select').empty();
            return;
        }
        table.column(5).search(selectedInfo).draw();
        $('#subInfoFilter select').empty();
        var subInfoValues = table
            .column(6)
            .data()
            .filter(function(value, index) {
                return (
                    table.column(4).data()[index] === $('#parentFilter select').val() &&
                    table.column(5).data()[index] === selectedInfo
                );
            })
            .unique();
        subInfoValues.sort();				
        subInfoValues.each(function(value) {
            $('#subInfoFilter select').append('<option value="' + value + '">' + value + '</option>');
        });
        table.on('draw.dt', function() {
            table.rows().deselect();
        });
    });
    $('#subInfoFilter select').on('change', function() {
        var selectedSubInfo = $(this).val();
        if (!selectedSubInfo) {
            table.column(5).search($('#infoFilter select').val()).draw();
            return;
        }
        table.column(6).search(selectedSubInfo).draw();
        table.on('draw.dt', function() {
            table.rows().deselect();
        });
    });
    
$("#env_val").on("click", function () {
    var rows_selected = table.rows({selected: true}).data();
    var idt = [];
    $.each(rows_selected, function (index, value) {
        idt.push(value[1]);
    });
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
    var rows_selected = table.rows({selected: true}).data();
    var idpdf = [];
    var codigo = [];
    $.each(rows_selected, function (index, value) {
        idpdf.push(value[0]);
    });

    $.each(rows_selected, function (index, value) {
        codigo.push(value[3]);
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
$("#pdfs1").on("click", function () {
    var rows_selected = table.rows({selected: true}).data();
    var idpdf = [];
    var codigo= [];
    $.each(rows_selected, function (index, value) {
        idpdf.push(value[0]);
    });

    $.each(rows_selected, function (index, value) {
        codigo.push(value[3]);
    });
        window.location.href = "/archivo/" + idpdf + "/" + codigo;		
    });
});
