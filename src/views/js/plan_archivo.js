$(document).ready(function () {

    var currentYear = new Date().getFullYear();

    for (var i = -10; i <= 10; i++) {
        var yearToAdd = currentYear + i;
        var selectedAttribute = (i === 0) ? 'selected' : '';
        $('#ano1').append('<option value="' + yearToAdd + '" ' + selectedAttribute + '>' + yearToAdd + '</option>');
        $('#ano2').append('<option value="' + yearToAdd + '" ' + selectedAttribute + '>' + yearToAdd + '</option>');
    }

    function _(element) {
        return document.getElementById(element);
    }

    function fetch_data(parent_element, child_element, type) {
        fetch('/get_datapla?type=' + type + '&parent_value=' + parent_element.value + '').then(function (response) {
            return response.json();
        }).then(function (responseData) {
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

    _('gerencia').onchange = function () {
        fetch_data(_('gerencia'), _('area'), 'load_areass');
    };

    _('area').onchange = function () {
        fetch_data(_('area'), _('sector'), 'load_sectoress');
    };

    _('sector').onchange = function () {
        fetch_data(_('sector'), _('equipo'), 'load_equiposs');
    };


    $('#plan_archivo').on('click', function () {
        var date1 = $('#date1').val();
        var ano1 = $('#ano1').val();
        var date2 = $('#date2').val();
        var ano2 = $('#ano2').val();
        var inputFile = $('#file-input')[0];

        if (!date1 || !ano1 || !date2 || !ano2) {
            swal("Error", "Ingrese ambas fechas y años.", "error");
            return;
        }

        var fecha1 = new Date(`${ano1}-${date1}`);
        var fecha2 = new Date(`${ano2}-${date2}`);

        if (fecha2 < fecha1) {
            swal("Error", "La primera fecha no puede ser mayor que la segunda.", "error");
            return;
        }

        if (inputFile.files.length === 0) {
            swal("Error", "Seleccione un archivo.", "error");
            return;
        }

        var fileName = inputFile.files[0].name;
        var fileExtension = fileName.split('.').pop().toLowerCase();

        if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
            swal("Error", "Seleccione un archivo Excel válido.", "error");
            $('#file-input').val('');
            return;
        }

        var input = document.querySelector('#file-input');
        var file = input.files[0];

        var formData = new FormData();
        formData.append('file', file);
        formData.append('date1', date1);
        formData.append('ano1', ano1);
        formData.append('date2', date2);
        formData.append('ano2', ano2);

        swal({
            title: "¡SAPMA!",
            text: "¿Desea planificar las tareas para el periodo seleccionado?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: true
        }, function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/verificacion_tareas1',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    beforeSend: function () {
                        swal({
                            title: "Verificando",
                            text: "Espere un momento por favor...",
                            imageUrl: "/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                        });
                    }
                }).done(function (response) {
                    if (response === "tareas") {
                        swal({
                            title: "Existen tareas asociadas a algunos equipos en el periodo ingresado",
                            text: "¿Desea continuar con la planificación?",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonClass: "btn-primary",
                            confirmButtonText: "Si",
                            cancelButtonText: "No",
                            closeOnConfirm: false
                        }, function (isConfirm) {
                            if (isConfirm) {
                                $.ajax({
                                    url: '/verificacion_tareas',
                                    type: 'POST',
                                    data: formData,
                                    processData: false,
                                    contentType: false,
                                    beforeSend: function () {
                                        swal({
                                            title: "Verificando",
                                            text: "Espere un momento por favor...",
                                            imageUrl: "/img/Spinner-1s-200px2.gif",
                                            showConfirmButton: false,
                                            allowOutsideClick: false
                                        });
                                    }
                                }).done(function (response) {
                                    if (response === "ok") {
                                        $.ajax({
                                            url: '/planificacion_archivo',
                                            type: 'POST',
                                            data: formData,
                                            processData: false,
                                            contentType: false,
                                            beforeSend: function () {
                                                swal({
                                                    title: "Creando Tareas",
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

                                    } else if (response === "repetidos") {
                                        swal({
                                            title: "Error",
                                            text: "No es posible crear tareas en este periodo para los equipos ingresados. Ya existen tareas con algunas de estas fechas. Por favor verifique la información.",
                                            type: "error",
                                            confirmButtonText: "Aceptar",
                                            allowOutsideClick: false
                                        });
                                    }
                                })
                            }
                        });
                    } else if (response === "notareas") {
                        $.ajax({
                            url: '/verificacion_tareas',
                            type: 'POST',
                            data: formData,
                            processData: false,
                            contentType: false,
                            beforeSend: function () {
                                swal({
                                    title: "Verificando",
                                    text: "Espere un momento por favor...",
                                    imageUrl: "/img/Spinner-1s-200px2.gif",
                                    showConfirmButton: false,
                                    allowOutsideClick: false
                                });
                            }
                        }).done(function (response) {
                            if (response === "ok") {
                                $.ajax({
                                    url: '/planificacion_archivo',
                                    type: 'POST',
                                    data: formData,
                                    processData: false,
                                    contentType: false,
                                    beforeSend: function () {
                                        swal({
                                            title: "Creando Tareas",
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
                            } else if (response === "repetidos") {
                                swal({
                                    title: "Error",
                                    text: "No es posible crear tareas en este periodo para los equipos ingresados. Ya existen tareas con algunas de estas fechas. Por favor verifique la información.",
                                    type: "error",
                                    confirmButtonText: "Aceptar",
                                    allowOutsideClick: false
                                });

                            }
                        })
                    }
                })
            }
        }
        );


        // $.ajax({
        //     url: '/verificacion_tareas',
        //     type: 'POST',
        //     data: formData,
        //     processData: false,
        //     contentType: false,
        //     beforeSend: function() {
        //         swal({
        //             title: "Verificando",
        //             text: "Espere un momento por favor...",
        //             imageUrl: "/img/Spinner-1s-200px2.gif",
        //             showConfirmButton: false,
        //             allowOutsideClick: false
        //         });
        //     }
        // }).done(function (response) {
        //     if (response === "ok"){
        //         swal({
        //             title: "¡SAPMA!",
        //             text: "¿Desea planificar las tareas para el periodo seleccionado?",
        //             type: "warning",
        //             showCancelButton: true,
        //             confirmButtonClass: "btn-primary",
        //             confirmButtonText: "Si",
        //             cancelButtonText: "No",
        //             closeOnConfirm: true
        //         }, function(isConfirm){
        //             if(isConfirm){
        //                 $.ajax({
        //                     url: '/verificacion_tareas1',
        //                     type: 'POST',
        //                     data: formData,
        //                     processData: false,
        //                     contentType: false,
        //                     beforeSend: function() {
        //                         setTimeout(function() {
        //                             swal({
        //                                 title: "Procesando",
        //                                 text: "Espere un momento por favor...",
        //                                 imageUrl: "/img/Spinner-1s-200px2.gif",
        //                                 showConfirmButton: false,
        //                                 allowOutsideClick: false
        //                             });
        //                         }, 100); 
        //                     }  
        //                 }).done(function (response) {
        //                     if (response === "tareas") {
        //                         swal({
        //                             title: "Existen tareas asociadas a algunos equipos en el periodo ingresado",
        //                             text: "¿Desea continuar con la planificación?",
        //                             type: "warning",
        //                             showCancelButton: true,
        //                             confirmButtonClass: "btn-primary",
        //                             confirmButtonText: "Si",
        //                             cancelButtonText: "No",
        //                             closeOnConfirm: false      
        //                             },function(isConfirm) {
        //                                 if(isConfirm){
        //                                     $.ajax({
        //                                         url: '/planificacion_archivo',
        //                                         type: 'POST',
        //                                         data: formData,
        //                                         processData: false,
        //                                         contentType: false,
        //                                         beforeSend: function() {
        //                                             swal({
        //                                                 title: "Creando Tareas",
        //                                                 text: "Espere un momento por favor...",
        //                                                 imageUrl: "/img/Spinner-1s-200px2.gif",
        //                                                 showConfirmButton: false,
        //                                                 allowOutsideClick: false
        //                                             });
        //                                         }
        //                                     }).done(function (response) {
        //                                         if (response === "ok") {
        //                                             swal({
        //                                                 title: "Tareas Creadas",
        //                                                 type: "success",
        //                                                 confirmButtonText: "Aceptar",
        //                                                 allowOutsideClick: false
        //                                             }, function (isConfirm) {
        //                                                 if (isConfirm) {
        //                                                     location.reload();
        //                                                 }
        //                                             });
        //                                         } else {
        //                                             swal("Error", "No se pudo crear las tareas", "error");
        //                                         }
        //                                     }).fail(function (jqXHR, textStatus, errorThrown) {
        //                                         console.error("Error en la llamada AJAX:", textStatus, errorThrown);
        //                                         swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
        //                                     });
        //                                 }
        //                             });
        //                     } else if (response === "notareas"){
        //                         $.ajax({
        //                             url: '/planificacion_archivo',
        //                             type: 'POST',
        //                             data: formData,
        //                             processData: false,
        //                             contentType: false,
        //                             beforeSend: function() {
        //                                 swal({
        //                                     title: "Creando Tareas",
        //                                     text: "Espere un momento por favor...",
        //                                     imageUrl: "/img/Spinner-1s-200px2.gif",
        //                                     showConfirmButton: false,
        //                                     allowOutsideClick: false
        //                                 });
        //                             }
        //                         }).done(function (response) {
        //                             if (response === "ok") {
        //                                 swal({
        //                                     title: "Tareas Creadas",
        //                                     type: "success",
        //                                     confirmButtonText: "Aceptar",
        //                                     allowOutsideClick: false
        //                                 }, function (isConfirm) {
        //                                     if (isConfirm) {
        //                                         location.reload();
        //                                     }
        //                                 });
        //                             } else {
        //                                 swal("Error", "No se pudo crear las tareas", "error");
        //                             }
        //                         }).fail(function (jqXHR, textStatus, errorThrown) {
        //                             console.error("Error en la llamada AJAX:", textStatus, errorThrown);
        //                             swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
        //                         });
        //                     }
        //                 }).fail(function (jqXHR, textStatus, errorThrown) {
        //                     console.error("Error en la llamada AJAX:", textStatus, errorThrown);
        //                     swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
        //                 });
        //             }
        //         });
        //     } else {
        //         swal({
        //             title: "Error",
        //             text: "No es posible crear tareas en este periodo para los equipos ingresados. Ya existen tareas con algunas de estas fechas. Por favor verifique la información.",
        //             type: "error",
        //             confirmButtonText: "Aceptar",
        //             allowOutsideClick: false
        //         });	
        //     }
        // })

    });

    $("#crear_plantilla").on("click", function () {

        const gerencia = $('#gerencia').val();
        const area = $('#area').val();
        const sector = $('#sector').val();
        const equipo = $('#equipo').val();

        const data = {
            gerencia,
            area,
            sector,
            equipo
        };

        $.ajax({
            url: '/genera_plan',
            type: 'POST',
            data: data,
            dataType: 'text',
            beforeSend: function () {
                swal({
                    title: "Generando plantilla",
                    text: "Espere un momento por favor...",
                    imageUrl: "/img/Spinner-1s-200px2.gif",
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
            }
        }).done(function (response) {
            if (response === "ok") {
                swal({
                    title: "Plantilla generada",
                    text: "Se ha crado un archivo excel",
                    type: "success",
                    confirmButtonText: "Descargar",
                    allowOutsideClick: false
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = "/excel_download";
                    }
                });
            } else {
                swal("Error", "No se pudo generar la plantilla", "error");
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error("Error en la llamada AJAX:", textStatus, errorThrown);
            swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
        });

    });

});
