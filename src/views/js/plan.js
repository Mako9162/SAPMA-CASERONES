var table;
var table1;

$(document).ready(function() {

    var currentYear = new Date().getFullYear();

    for (var i = -10; i <= 10; i++) {
        var yearToAdd = currentYear + i;
        var selectedAttribute = (i === 0) ? 'selected' : ''; 
        $('#ano1').append('<option value="' + yearToAdd + '" ' + selectedAttribute + '>' + yearToAdd + '</option>');
        $('#ano2').append('<option value="' + yearToAdd + '" ' + selectedAttribute + '>' + yearToAdd + '</option>');
    }  

    function _(element)
    {
        return document.getElementById(element); 
    }

    function fetch_data(parent_element, child_element, type) {
        fetch('/get_datapla?type=' + type + '&parent_value=' + parent_element.value + '').then(function(response) {
            return response.json();
        }).then(function(responseData) {
            var html = '';

            if (type == 'load_areass') {
                html = '<option value="">Seleccione un área</option>';
                for (var count = 0; count < responseData.length; count++) {
                    html += '<option value="' + responseData[count][0] + '">' + responseData[count][1] + '</option>';
                }

                _('area').innerHTML = html;
                _('sector').innerHTML = '<option value="">Seleccione un sector</option>';
                _('equipo').innerHTML = '<option value="">Seleccione un equipo</option>';

            } else if (type == 'load_sectoress') {
                html = '<option value="">Seleccione un sector</option>';
                for (var count = 0; count < responseData.length; count++) {
                    html += '<option value="' + responseData[count][0] + '">' + responseData[count][1] + '</option>';
                }

                _('sector').innerHTML = html;
                _('equipo').innerHTML = '<option value="">Seleccione un equipo</option>';

            } else if (type == 'load_equiposs') {
                html = '<option value="">Seleccione un equipo</option>';
                for (var count = 0; count < responseData.length; count++) {
                    html += '<option value="' + responseData[count][0] + '">' + responseData[count][1] + '</option>';
                }

                _('equipo').innerHTML = html;
            }
        });
    }

    _('gerencia').onchange = function(){		
        fetch_data(_('gerencia'), _('area'), 'load_areass');
    };

    _('area').onchange = function(){
        fetch_data(_('area'), _('sector'), 'load_sectoress');
    };

    _('sector').onchange = function(){
        fetch_data(_('sector'), _('equipo'), 'load_equiposs');
    };

    function initDataTable() {
        table = $('#tabla_plan').DataTable({
            "searching": true,
            "lengthChange": false,
            "colReorder": true,
            'select': {
                'style': 'multi'
            },
            "dom": 'f<"botones">rtip',
            "bDestroy": true, 	
            "bInfo": true,
            "iDisplayLength": 10,
            "autoWidth": true,
            "scrollY": true, 
            "language": {
                "sProcessing": "Procesando...",
                "sLengthMenu": "Mostrar _MENU_ registros",
                "sZeroRecords": "No se encontraron resultados",
                "sEmptyTable": "Ningún dato disponible",
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

        });

        table.on('select', function (e, dt, type, indexes) {
            var selectedRows = table.rows({ selected: true }).count();
    
            if (selectedRows > 5) {
                table.rows(indexes).deselect();
            }
    
            if (type === 'row') {
                for (var i = 0; i < indexes.length; i++) {
                    var rowData = table.row(indexes[i]).data();
                    if (rowData[8].trim() === 'Sin ciclo asignado') {
                        table.rows(indexes[i]).deselect();
                    }
                }
            }
        });

        
        $("div.botones").html('<button id="seleccionar" class="btn btn-inline btn-secondary btn-sm">Borrar selección</button>'
        )

        $('#seleccionar').on('click', function () {
            var visibleRows = table.rows({ search: 'applied' }).nodes();
    
            if (table.rows({ selected: true }).count() > 0) {
                table.rows().deselect();
            }
        });

        // $('#tabla_plan tbody').on('click', 'tr', function () {
        //     var visibleRows = table.rows({ search: 'applied' }).nodes();

        //     if (table.rows({ selected: true }).count() >= 5) {

        //         table.row(this).deselect();
        //     } else {

        //         table.row(this).select();
        //     }
        // });
    
    }

    initDataTable();  

    $('#filtrar').click(function () {
        var gerencia = $('#gerencia').val();
        var area = $('#area').val();
        var sector = $('#sector').val();
        var equipo = $('#equipo').val();
    
        var data = {
            gerencia: gerencia,
            area: area,
            sector: sector,
            equipo: equipo
        };
    
        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });
    
        $.ajax({
            url: '/buscar_plan',
            type: 'POST',
            data: data
        }).done(function (data) {
            swal.close();
    
            if ($.fn.DataTable.isDataTable('#tabla_plan')) {
                table.clear().destroy();
            }
    
            $('#tabla_plan tbody').empty();
    
            data.forEach(function (item) {
                var ciclo = item.CICLO !== null ? item.CICLO : "Sin ciclo asignado";
                $('#tabla_plan tbody').append(`
                    <tr>
                        <td>${item.ID}</td>
                        <td>${item.CODIGO}</td>
                        <td hidden="true">${item.IDTP}</td>
                        <td>${item.TIPO}</td>
                        <td>${item.GER}</td>
                        <td>${item.AREA}</td>
                        <td>${item.SECTOR}</td>
                        <td hidden="true">${item.IDCICLO}</td>
                        <td>${ciclo}</td>
                        <td><a class="ver-tareas"><center>Ver Tareas</center></a></td>
                    </tr>
                `);
            });
    
            initDataTable();
        });
    });

    $('#tabla_plan tbody').on('click', 'a.ver-tareas', function () {
        var idFila = $(this).closest('tr').find('td:first').text(); 
        var equipo = $(this).closest('tr').find('td:eq(1)').text();

        $.ajax({
            url: '/obtener_detalles_tareas',
            type: 'POST',
            data: { id: idFila }
        }).done(function (response) {
            if (response.success) {
                var detalles = response.detalles;

                var tablaDetalle = $('#tabla_detalle_tareas tbody');
                tablaDetalle.empty();
    
                detalles.forEach(function (detalle) {
                    tablaDetalle.append(`
                        <tr>
                            <td>${detalle.ID}</td>
                            <td>${detalle.FECHA}</td>
                            <td>${detalle.TECNICO}</td>
                            <td>${detalle.ESTADO}</td>
                            <td>${detalle.EQUIPO}</td>
                            <td>${detalle.TIPO}</td>
                            <td>${detalle.PROTOCOLO}</td>
                        </tr>
                    `);
                });

                table1 = $('#tabla_detalle_tareas').DataTable({
                    "dom": 'Bfrtp',
                    'select': {
                        'style': 'single'
                    },
                    "bInfo": true,
                    "iDisplayLength": 8,
                    "searching": true,
                    "lengthChange": false,
                    "colReorder": true,
                    "buttons": [
                        {
                            "extend": 'excelHtml5',
                            "text": '<i class="fa fa-file-excel-o"></i>',
                            "title": 'Tareas_'+ equipo,
                            "titleAttr": 'Exportar a Excel',
                            "className": 'btn btn-rounded btn-success'
                        }    
                    ],
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
                    }
                });

                $('#titulo_detalle_tareas').text('Tareas del equipo '+equipo);
                $('#detalle_tareas').modal('show');
            } else {
                console.error(response.error);
            }
        });
    });

    $('#detalle_tareas').on('hidden.bs.modal', function () {

        if (table1) {
            table1.destroy();
            table1 = null;
        }

        $('#tabla_detalle_ciclo tbody').empty();
    });

    $('#planificar').on('click', function () {

        var filasSeleccionadas = table.rows({ selected: true }).count();

        if (filasSeleccionadas > 0 ){
            $('#planificacion').modal('show');
        }else{
            swal("Error", "Debe seleccionar uno o varios equipos planificar", "error");
        }
    });

    $('#crear_plan').on('click', function () {

        const date1 = $('#date1').val();
        const ano1 = $('#ano1').val();
        const date2 = $('#date2').val();
        const ano2 = $('#ano2').val();
        const tecnico = $('#tecnico').val();
    
        if (!date1 || !ano1 || !date2 || !ano2) {
            swal("Error", "Ingrese ambas fechas y años.", "error");
            return;
        }

        const fecha1 = new Date(`${ano1}-${date1}`);
        const fecha2 = new Date(`${ano2}-${date2}`);

        if (fecha2 < fecha1) {
            swal("Error", "La primera fecha no puede ser mayor que la segunda.", "error");
            return;
        }

        if(!tecnico){
            swal("Error", "Debe seleccionar un técnico para planificar.", "error");
            return;
        }

        const filasSeleccionadas = table.rows({ selected: true }).data();
        const valoresColumnas = filasSeleccionadas.toArray().map(function(row) {
            return {
                ID:row[0],
                CICLO:row[7]
            }; 
        });
        
        const data = {
            date1,
            ano1,
            date2,
            ano2,
            tecnico,
            valoresColumnas
        }

        $.ajax({
            url: '/verificar_tareas',
            type: 'POST',
            data:data,
            beforeSend: function() {
                swal({
                    title: "Verificando",
                    text: "Espere un momento por favor...",
                    imageUrl: "/img/Spinner-1s-200px2.gif",
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
            }
        }).done(function(response){
            if (response === "cuenta_positiva"){
                swal({
                    title: "Existen tareas en el periodo seleccionado",
                    text: "¿Desea continuar con la planificación?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-primary",
                    confirmButtonText: "Si",
                    cancelButtonText: "No",
                    closeOnConfirm: false 
                }, function (isConfirm){
                    if(isConfirm){
                        $.ajax({
                        url: '/verificar_tareas1',
                        type: 'POST',
                        data:data,
                        beforeSend: function() {
                            swal({
                                title: "Verificando",
                                text: "Espere un momento por favor...",
                                imageUrl: "/img/Spinner-1s-200px2.gif",
                                showConfirmButton: false,
                                allowOutsideClick: false
                            });
                        }
                        }).done(function(response){
                            if(response === "positiva"){
                                swal({
                                    title: "Ya existen tareas para algunos equipos seleccionados en las fechas a planificar",
                                    text: "¿Desea continuar con la planificación?",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonClass: "btn-primary",
                                    confirmButtonText: "Si",
                                    cancelButtonText: "No",
                                    closeOnConfirm: false 
                                }, function (isConfirm){
                                    if(isConfirm){
                                        $.ajax({
                                            url: '/verificar_tareas2',
                                            type: 'POST',
                                            data:data,
                                            beforeSend: function() {
                                                swal({
                                                    title: "Verificando",
                                                    text: "Espere un momento por favor...",
                                                    imageUrl: "/img/Spinner-1s-200px2.gif",
                                                    showConfirmButton: false,
                                                    allowOutsideClick: false
                                                });
                                            }
                                        }).done(function(response){
                                            if(response ==="pasado"){
                                                swal({
                                                    title: "Ya existen las tareas maximas diarias para algunas fechas a planificar",
                                                    text: "¿Desea continuar con la planificación?",
                                                    type: "warning",
                                                    showCancelButton: true,
                                                    confirmButtonClass: "btn-primary",
                                                    confirmButtonText: "Si",
                                                    cancelButtonText: "No",
                                                    closeOnConfirm: false 
                                                }, function(isConfirm){
                                                    if(isConfirm){
                                                        $.ajax({
                                                            url: '/crear_plan',
                                                            type: 'POST',
                                                            data:data,
                                                            beforeSend: function() {
                                                                swal({
                                                                    title: "Planificando",
                                                                    text: "Espere un momento por favor...",
                                                                    imageUrl: "/img/Spinner-1s-200px2.gif",
                                                                    showConfirmButton: false,
                                                                    allowOutsideClick: false
                                                                });
                                                            }
                                                        }).done(function (response) {
                                                            if (response === "ok") {
                                                                swal({
                                                                    title: "Tareas Creadas",
                                                                    type: "success",
                                                                    confirmButtonText: "Aceptar",
                                                                    allowOutsideClick: false
                                                                }, function (isConfirm) {
                                                                    if (isConfirm) {
                                                                        location.reload();
                                                                    }
                                                                });
                                                            } else {
                                                                swal("Error", "No se pudo crear las tareas", "error");
                                                            }
                                                        }).fail(function (jqXHR, textStatus, errorThrown) {
                                                            console.error("Error en la llamada AJAX:", textStatus, errorThrown);
                                                            swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
                                                        }); 
                                                    }
                                                })

                                            }else if(response ==="no pasado"){
                                                $.ajax({
                                                    url: '/crear_plan',
                                                    type: 'POST',
                                                    data:data,
                                                    beforeSend: function() {
                                                        swal({
                                                            title: "Planificando",
                                                            text: "Espere un momento por favor...",
                                                            imageUrl: "/img/Spinner-1s-200px2.gif",
                                                            showConfirmButton: false,
                                                            allowOutsideClick: false
                                                        });
                                                    }
                                                }).done(function (response) {
                                                    if (response === "ok") {
                                                        swal({
                                                            title: "Tareas Creadas",
                                                            type: "success",
                                                            confirmButtonText: "Aceptar",
                                                            allowOutsideClick: false
                                                        }, function (isConfirm) {
                                                            if (isConfirm) {
                                                                location.reload();
                                                            }
                                                        });
                                                    } else {
                                                        swal("Error", "No se pudo crear las tareas", "error");
                                                    }
                                                }).fail(function (jqXHR, textStatus, errorThrown) {
                                                    console.error("Error en la llamada AJAX:", textStatus, errorThrown);
                                                    swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
                                                }); 
                                            }
                                        })
                                    }
                                })
                            }else if(response === "negativa"){
                                $.ajax({
                                    url: '/verificar_tareas2',
                                    type: 'POST',
                                    data:data,
                                    beforeSend: function() {
                                        swal({
                                            title: "Verificando",
                                            text: "Espere un momento por favor...",
                                            imageUrl: "/img/Spinner-1s-200px2.gif",
                                            showConfirmButton: false,
                                            allowOutsideClick: false
                                        });
                                    }
                                }).done(function(response){
                                    if(response ==="pasado"){
                                        swal({
                                            title: "Ya existen las tareas maximas diarias para algunas fechas a planificar",
                                            text: "¿Desea continuar con la planificación?",
                                            type: "warning",
                                            showCancelButton: true,
                                            confirmButtonClass: "btn-primary",
                                            confirmButtonText: "Si",
                                            cancelButtonText: "No",
                                            closeOnConfirm: false 
                                        }, function(isConfirm){
                                            if(isConfirm){
                                                $.ajax({
                                                    url: '/crear_plan',
                                                    type: 'POST',
                                                    data:data,
                                                    beforeSend: function() {
                                                        swal({
                                                            title: "Planificando",
                                                            text: "Espere un momento por favor...",
                                                            imageUrl: "/img/Spinner-1s-200px2.gif",
                                                            showConfirmButton: false,
                                                            allowOutsideClick: false
                                                        });
                                                    }
                                                }).done(function (response) {
                                                    if (response === "ok") {
                                                        swal({
                                                            title: "Tareas Creadas",
                                                            type: "success",
                                                            confirmButtonText: "Aceptar",
                                                            allowOutsideClick: false
                                                        }, function (isConfirm) {
                                                            if (isConfirm) {
                                                                location.reload();
                                                            }
                                                        });
                                                    } else {
                                                        swal("Error", "No se pudo crear las tareas", "error");
                                                    }
                                                }).fail(function (jqXHR, textStatus, errorThrown) {
                                                    console.error("Error en la llamada AJAX:", textStatus, errorThrown);
                                                    swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
                                                }); 
                                            }
                                        })

                                    }else if(response ==="no pasado"){
                                        $.ajax({
                                            url: '/crear_plan',
                                            type: 'POST',
                                            data:data,
                                            beforeSend: function() {
                                                swal({
                                                    title: "Planificando",
                                                    text: "Espere un momento por favor...",
                                                    imageUrl: "/img/Spinner-1s-200px2.gif",
                                                    showConfirmButton: false,
                                                    allowOutsideClick: false
                                                });
                                            }
                                        }) .done(function (response) {
                                            if (response === "ok") {
                                                swal({
                                                    title: "Tareas Creadas",
                                                    type: "success",
                                                    confirmButtonText: "Aceptar",
                                                    allowOutsideClick: false
                                                }, function (isConfirm) {
                                                    if (isConfirm) {
                                                        location.reload();
                                                    }
                                                });
                                            } else {
                                                swal("Error", "No se pudo crear las tareas", "error");
                                            }
                                        }).fail(function (jqXHR, textStatus, errorThrown) {
                                            console.error("Error en la llamada AJAX:", textStatus, errorThrown);
                                            swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
                                        });
                                    }
                                })
                            }
                        });
                    }
                }
                );
            }else if(response === "cuenta_negativa"){
                $.ajax({
                    url: '/verificar_tareas1',
                    type: 'POST',
                    data:data,
                    beforeSend: function() {
                        swal({
                            title: "Verificando",
                            text: "Espere un momento por favor...",
                            imageUrl: "/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                        });
                    }
                }).done(function(response){
                    if(response === "positiva"){
                        swal({
                            title: "Ya existen tareas para algunos equipos seleccionados en las fechas a planificar",
                            text: "¿Desea continuar con la planificación?",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonClass: "btn-primary",
                            confirmButtonText: "Si",
                            cancelButtonText: "No",
                            closeOnConfirm: false 
                        }, function (isConfirm){
                            if(isConfirm){
                                $.ajax({
                                    url: '/verificar_tareas2',
                                    type: 'POST',
                                    data:data,
                                    beforeSend: function() {
                                        swal({
                                            title: "Verificando",
                                            text: "Espere un momento por favor...",
                                            imageUrl: "/img/Spinner-1s-200px2.gif",
                                            showConfirmButton: false,
                                            allowOutsideClick: false
                                        });
                                    }
                                })
                            }
                        })
                    }else if(response === "negativa"){
                        $.ajax({
                            url: '/verificar_tareas2',
                            type: 'POST',
                            data:data,
                            beforeSend: function() {
                                swal({
                                    title: "Verificando",
                                    text: "Espere un momento por favor...",
                                    imageUrl: "/img/Spinner-1s-200px2.gif",
                                    showConfirmButton: false,
                                    allowOutsideClick: false
                                });
                            }
                        }).done(function(response){
                            if(response ==="pasado"){
                                swal({
                                    title: "Ya existen las tareas maximas diarias para algunas fechas a planificar",
                                    text: "¿Desea continuar con la planificación?",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonClass: "btn-primary",
                                    confirmButtonText: "Si",
                                    cancelButtonText: "No",
                                    closeOnConfirm: false 
                                }, function(isConfirm){
                                    if(isConfirm){
                                        $.ajax({
                                            url: '/crear_plan',
                                            type: 'POST',
                                            data:data,
                                            beforeSend: function() {
                                                swal({
                                                    title: "Planificando",
                                                    text: "Espere un momento por favor...",
                                                    imageUrl: "/img/Spinner-1s-200px2.gif",
                                                    showConfirmButton: false,
                                                    allowOutsideClick: false
                                                });
                                            }
                                        }) .done(function (response) {
                                            if (response === "ok") {
                                                swal({
                                                    title: "Tareas Creadas",
                                                    type: "success",
                                                    confirmButtonText: "Aceptar",
                                                    allowOutsideClick: false
                                                }, function (isConfirm) {
                                                    if (isConfirm) {
                                                        location.reload();
                                                    }
                                                });
                                            } else {
                                                swal("Error", "No se pudo crear las tareas", "error");
                                            }
                                        }).fail(function (jqXHR, textStatus, errorThrown) {
                                            console.error("Error en la llamada AJAX:", textStatus, errorThrown);
                                            swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
                                        });
                                    }
                                })

                            }else if(response ==="no pasado"){
                                $.ajax({
                                    url: '/crear_plan',
                                    type: 'POST',
                                    data:data,
                                    beforeSend: function() {
                                        swal({
                                            title: "Planificando",
                                            text: "Espere un momento por favor...",
                                            imageUrl: "/img/Spinner-1s-200px2.gif",
                                            showConfirmButton: false,
                                            allowOutsideClick: false
                                        });
                                    }
                                }) .done(function (response) {
                                    if (response === "ok") {
                                        swal({
                                            title: "Tareas Creadas",
                                            type: "success",
                                            confirmButtonText: "Aceptar",
                                            allowOutsideClick: false
                                        }, function (isConfirm) {
                                            if (isConfirm) {
                                                location.reload();
                                            }
                                        });
                                    } else {
                                        swal("Error", "No se pudo crear las tareas", "error");
                                    }
                                }).fail(function (jqXHR, textStatus, errorThrown) {
                                    console.error("Error en la llamada AJAX:", textStatus, errorThrown);
                                    swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
                                });
                            }
                        })
                    }
                });
            }
        })
        
    });



});