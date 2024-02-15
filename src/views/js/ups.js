$(document).ready(function () {

    $('#tag').on('change', function() {
        var tag = $(this).val();
        $.ajax({
            url: '/check-tag',
            type: 'POST',
            data: { tag: tag },
            success: function(data) {
            if (data.exists) {
                swal("¡SAPMA!", "TAG ya existe. Por favor ingrese uno distinto.", "error");
                $('#tag').val('');
            }
            }
        });
    });

    function _(element)
    {
        return document.getElementById(element); 
    }

    function fetch_data( parent_element, child_element, type)
    {
        fetch('/get_databi?type='+type+'&parent_value='+parent_element.value+'').then(function(response){
            return response.json();
        }).then(function(responseData){

            var html = '';

            if(type == 'load_areass'){
                html = '<option value="">Seleccione un área</option>';
                for(var count = 0; count < responseData.length; count++)
                {
                    html += '<option value="'+responseData[count][0]+'">'+responseData[count][1]+'</option>';    
                }
                
            }

            if(type == 'load_sectoress'){
                html = '<option value="">Seleccione una sala</option>';
                for(var count = 0; count < responseData.length; count++)
                {
                    html += '<option value="'+responseData[count][0]+'">'+responseData[count][1]+'</option>';    
                }
            }

            child_element.innerHTML = html;

            if (type == 'load_areass' && parent_element.value === '') {
            var sectorDefaultText = "Seleccione una sala";
            _('sector').value = '';
            _('sector').innerHTML = '<option value="">' + sectorDefaultText + '</option>'; 
            }
        });
    }

    _('gerencia').onchange = function(){			
        fetch_data(_('gerencia'), _('area'), 'load_areass');
    };

    _('area').onchange = function(){
        fetch_data(_('area'), _('sector'), 'load_sectoress');
    };

    $('#tipoequipo').on('click', function() {
        $('#modal_tipoequipo').modal('show');
    });

    $('#marcamodelo').on('click', function() {
        $('#modal_marcamodelo').modal('show');
    });

    $('#agrega_bateria_b').on('click', function() {
        $('#agrega_bateria').modal('show');
    });

    $('#guardar_marcamodelo').on('click', function(){
        var marca = $('#marca').val();
        var modelo = $('#modelo').val();
        if(!marca || !modelo){
            swal("¡SAPMA!", "Debe ingresar marca y modelo.", "error");
        }else{
            $.ajax({
                url: '/verificar_mm',
                method: 'POST',
                data: { marca: marca, modelo: modelo },
                success: function(data) {
                if (data.error) {
                    swal({
                    title: "¡SAPMA!",
                    text: data.error,
                    type: "error",
                    confirmButtonClass: "btn-danger",
                    confirmButtonText: "Ok",
                    closeOnConfirm: true
                    });
                } else {
                    swal({
                    title: "¡SAPMA!",
                    text: "¿Desea agregar marca y modelo de equipo?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-primary",
                    confirmButtonText: "Si",
                    cancelButtonText: "No",
                    closeOnConfirm: true
                    }, function(isConfirm) {
                    if (isConfirm) {
                        $.ajax({
                        url: '/agregar_mm',
                        method: 'POST',
                        data: { marca: marca, modelo: modelo },
                        success: function(data) {
                            swal({
                            title: "¡SAPMA!",
                            text: "Registro agregado con exito",
                            type: "success",
                            confirmButtonClass: "btn-primary",
                            closeOnConfirm: true
                            });
                        $('#mm').append($('<option>', {
                            value: data.id,
                            text: data.descripcion
                        }));
                        $('#modal_marcamodelo').modal('hide');
                        $('#marca').val('');
                        $('#modelo').val('');
                        }
                        });
                    }
                    });
                }
                }
            });
        }
    });

    $('#guardar_tipoequipo').on('click', function() {
        var descripcion = $('#atp').val();
        if (!descripcion){
            swal("¡SAPMA!", "Debe ingresar una descripción.", "error");
        }else{
            $.ajax({
            url: '/verificar_tipo',
            method: 'POST',
            data: { descripcion: descripcion },
            success: function(data) {
            if (data.error) {
                swal({
                title: "¡SAPMA!",
                text: data.error,
                type: "error",
                confirmButtonClass: "btn-danger",
                confirmButtonText: "Ok",
                closeOnConfirm: true
                });
            } else {
                swal({
                title: "¡SAPMA!",
                text: "¿Desea agregar tipo de equipo?",
                type: "warning",
                showCancelButton: true,
                confirmButtonClass: "btn-primary",
                confirmButtonText: "Si",
                cancelButtonText: "No",
                closeOnConfirm: true
                }, function(isConfirm) {
                if (isConfirm) {
                    $.ajax({
                    url: '/agregar_tipo',
                    method: 'POST',
                    data: { descripcion: descripcion },
                    success: function(data) {
                        swal({
                        title: "¡SAPMA!",
                        text: "Tipo de equipo agregado con exito",
                        type: "success",
                        confirmButtonClass: "btn-primary",
                        closeOnConfirm: true
                        });
                        $('#tipoe').append($('<option>', {
                            value: data.id,
                            text: data.descripcion
                        }));
                        $('#modal_tipoequipo').modal('hide');
                        $('#atp').val('');
                    }
                    });
                }
                });
            }
            }
            });
        }
    });

    $('#bateria_select').change(function(){
        
        var selectedBateria = $(this).val();
       
        $.ajax({
            url: '/consulta_bat', 
            type: 'POST', 
            dataType: 'json', 
            data: {bateriaId: selectedBateria}, 
            success: function(response){

                $('#c_bat').val(response.CAPV+' V - '+response.CAPAH+' Ah');
                $('#c_imp').val(response.IMP);

            },
            error: function(xhr, status, error){

                console.error(error);

            }
        });
        
    });

    $('#sector').change(function(){

        var selectSectorText = $(this).find('option:selected').text();
        
        var parts = selectSectorText.split('-');
        
        var textoDespuesDelGuion = parts[1].trim(); 
        
        $('#du').val(textoDespuesDelGuion);
    });
    

    $(".inputClass").on("blur", function () {
        var valor = $(this).val();
        var valorSinEspacios = valor.replace(/\s+$/, "");
        $(this).val(valorSinEspacios);
    });
    
    $(".inputClass1").on("input", function () {
        $(this).val($(this).val().replace(/[^0-9.]/g, ""));
    
        var valor = $(this).val();
        var puntos = valor.match(/\./g);
        if (puntos && puntos.length > 1) {
          $(this).val(
            valor.replace(/\./g, function (match, offset, string) {
              return offset === 0 ? match : "";
            })
          );
        }
    });
    
    $(".integerInput").on("input", function () {
        var valor = $(this).val().replace(/\D/g, "");
        if (valor === "") {
          $(this).val("");
        } else {
          var numero = parseInt(valor, 10);
          if (numero < 0) {
            numero = 0;
          } else if (numero > 100) {
            numero = 100;
          }
          $(this).val(numero);
        }
    });

    $("#agregar").on("click", function () {

        var marca = $("#marca_bat").val();
        var modelo = $("#modelo_bat").val();
        var capacidad_v = $("#capacidad_v").val();
        var capacidad_ah = $("#capacidad_ah").val();
        var impedancia_dsh = $("#impedancia_dsh").val();
        var tolerancia_g = $("#tolerancia_g").val();
        var tolerancia_f = $("#tolerancia_f").val();
    
        if (marca.trim() === "" && modelo.trim() === "") {
          swal({
            title: "Error",
            text: "Debe ingresar al menos la marca o el modelo.",
            type: "error",
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Aceptar",
            closeOnConfirm: true,
          });
    
          return;
        }
    
        if (
          capacidad_v.trim() === "" ||
          capacidad_ah.trim() === "" ||
          impedancia_dsh.trim() === "" ||
          tolerancia_g.trim() === "" ||
          tolerancia_f.trim() === ""
        ) {
          swal({
            title: "Error",
            text: "Ingrese los datos de las capacidades, impedancia y tolerancia.",
            type: "error",
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Aceptar",
            closeOnConfirm: true,
          });
    
          return;
        }
    
        swal(
          {
            title: "¡SAPMA!",
            text: "¿Desea agregar esta batería?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: true,
          },
          function (isConfirm) {
            if (isConfirm) {
              $.ajax({
                url: "/guardar_bat",
                type: "POST",
                data: {
                  marca: marca,
                  modelo: modelo,
                  capacidad_v: capacidad_v,
                  capacidad_ah: capacidad_ah,
                  impedancia_dsh: impedancia_dsh,
                  tolerancia_g: tolerancia_g,
                  tolerancia_f: tolerancia_f,
                },
                success: function (response) {
                  swal({
                    title: "¡SAPMA!",
                    text: "La batería se ha agregado correctamente.",
                    type: "success",
                    confirmButtonClass: "btn-primary",
                    confirmButtonText: "Aceptar",
                    closeOnConfirm: true,
                  });
    
                  location.reload();
                },
                error: function (xhr, status, error) {
                  swal({
                    title: "Error",
                    text: "Ha ocurrido un error al intentar guardar la batería. Por favor, inténtelo de nuevo más tarde.",
                    type: "error",
                    confirmButtonClass: "btn-primary",
                    confirmButtonText: "Aceptar",
                    closeOnConfirm: true,
                  });
    
                  $("#marca").val("");
                  $("#modelo").val("");
                  $("#capacidad_v").val("");
                  $("#capacidad_ah").val("");
                  $("#impedancia_dsh").val("");
                  $("#tolerancia_g").val("");
                  $("#tolerancia_f").val("");
                },
              });
            }
          }
        );
    });

    $('#agrega_protocolos').on('click', function() {
        let tipoEquipo1 = $('#tipoe').val();

        if (tipoEquipo1 === "") {
            swal('SAPMA','Selecciona un tipo de equipo antes de continuar.', 'error');
            return;
        }

        $('#modal_protocolo').modal('show');
    });

    $('#modal_protocolo').on('hidden.bs.modal', function() {

        $('#form_protocolo')[0].reset();
        
        $('#protocolo').val('').trigger('change');
        $('#protocolo-correspondiente').empty().append('<option value="">Seleccione un protocolo</option>');
    });

    function updateProtocoloCorrespondienteOptions() {
        let tipoProtocolo = $('#protocolo').val();
        let tipoEquipo = $('#tipoe').val();
        $('#protocolo-correspondiente').empty().append('<option value="">Seleccione un protocolo</option>');

        if (tipoProtocolo) {
            $.get(`/ruta/protocolos/${tipoProtocolo}/${tipoEquipo}`, function(data) {
                data.forEach(function(protocolo) {
                    // Verificar si el protocolo ya está en la tabla
                    var isInTable = false;
                    $('#protocolos-seleccionados tr').each(function() {
                        var rowTipoProtocolo = $(this).find('td:nth-child(1)').text();
                        var rowProtocolo = $(this).find('td:nth-child(3)').text();
                        if (rowTipoProtocolo === tipoProtocolo && rowProtocolo === protocolo.Id) {
                            isInTable = true;
                            return false;
                        }
                    });

                    // Agregar la opción solo si el protocolo no está en la tabla
                    if (!isInTable) {
                        $('#protocolo-correspondiente').append(`<option value="${protocolo.Id}">${protocolo.Descripcion}</option>`);
                    }
                });
            });
        }
    }

    $('#protocolo').change(function() {
         updateProtocoloCorrespondienteOptions();
    });

    let tiposAsignados = [];
    
    $('#asignar').click(function() {
        let tipoProtocolo = $('#protocolo option:selected');
        let protocolo = $('#protocolo-correspondiente option:selected');
        let tipoProtocoloValue = tipoProtocolo.val();
        let protocoloValue = protocolo.val();

        if (tipoProtocoloValue && protocoloValue) {
            // Verificar si el protocolo ya está en la tabla
            var isInTable = false;
            $('#protocolos-seleccionados tr').each(function() {
                var rowTipoProtocolo = $(this).find('td:nth-child(1)').text();
                var rowProtocolo = $(this).find('td:nth-child(3)').text();
                if (rowTipoProtocolo === tipoProtocoloValue) {
                    isInTable = true;
                    return false;
                }
            });

            if (isInTable) {
                // Mostrar una alerta si el protocolo ya está en la tabla
                swal('SAPMA','Este tipo de tipo de protocolo ya está asignado. Por favor, elimínelo para poder continuar.','error');
                $('#modal_protocolo').modal('hide');
            } else {
                // Agregar la fila a la tabla si el protocolo no está en la tabla
                $('#protocolos-seleccionados').append(`<tr><td>${tipoProtocoloValue}</td><td>${tipoProtocolo.text()}</td><td>${protocoloValue}</td><td>${protocolo.text()}</td><td></button><button class="btn btn-inline btn-danger btn-sm ladda-button eliminar"><i class="fa fa-trash"></i></button></td></tr>`);
                $('#protocolo').val('');
                $('#protocolo-correspondiente').empty().append('<option value="">Seleccione un protocolo</option>');
                $('#modal_protocolo').modal('hide');
                $('.protocolo-field').show();

                tiposAsignados.push(tipoProtocoloValue);

                $(`#protocolo option[value="${tipoProtocoloValue}"]`).prop('disabled', true);
                $(`#protocolo option[value="${tipoProtocoloValue}"]`).prop('selected', false);

                updateProtocoloCorrespondienteOptions();
            }
        }
    });

    $('#tipoe').change(function() {
        $('#protocolos-seleccionados tr').each(function() {
            let tipoProtocolo = $(this).find('td:first-child').text();
            $(this).remove();
            $(`#protocolo option[value="${tipoProtocolo}"]`).prop('disabled', false);
        });

        tiposAsignados = [];
    });

    $('#protocolos-seleccionados').on('click', '.eliminar', function() {
    let tipoProtocolo = $(this).closest('tr').find('td:first-child').text();
        $(this).closest('tr').remove();
        $(`#protocolo option[value="${tipoProtocolo}"]`).prop('disabled', false);

        tiposAsignados = tiposAsignados.filter(function(tipo) {
            return tipo !== tipoProtocolo;
        });
    });

    $('#guardar').on('click', function() {

        var tag = $('#tag').val();
        var tipoe = $('#tipoe').val();
        var tipoe_text = $('#tipoe option:selected').text();
        var bateria_select = $('#bateria_select').val();
        var n_bat = $('#n_bat').val();
        var mm = $('#mm').val();
        var mm_text = $('#mm option:selected').text();
        var critico = $('#critico').val();
        var gerencia = $('#gerencia').val();
        var area = $('#area').val();
        var sector = $('#sector').val();
        var du = $('#du').val();
        var obs = $('#obs').val();
    
        var tipoProtocoloIds = [];
        var protocoloIds = [];
    
    
        $('#protocolos-seleccionados tr').each(function() {
          var tipoProtocoloId = $(this).find('td:nth-child(1)').text();
          var protocoloId = $(this).find('td:nth-child(3)').text();
    
    
          tipoProtocoloIds.push(tipoProtocoloId);
          protocoloIds.push(protocoloId);
        });
    
        var data = {
          tag: tag,
          tipoe_text: tipoe_text,
          tipoe: tipoe,
          mm: mm,
          mm_text: mm_text,
          bateria_select:bateria_select,
          n_bat:n_bat,
          critico: critico,
          gerencia: gerencia,
          area: area, 
          sector: sector,
          du: du,
          obs: obs,
          tipoProtocoloIds: tipoProtocoloIds,
          protocoloIds: protocoloIds
        };
    
        if (bateria_select === '' ||n_bat === '' ||tag === '' || tipoe === '' || critico === '' || gerencia === '' || area === '' || sector === '' || du === '' || tipoProtocoloIds.length < 1 || protocoloIds.length < 1) {
          swal("¡SAPMA!", "Inserte información en los campos obligatorios. Debe asignar al menos un protocolo (I),(M) o (P).", "error");
        } else {
          swal({
            title: "¡SAPMA!",
            text: "¿Desea agregar este equipo?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: true
          }, function(isConfirm){
            if(isConfirm){
              $.ajax({
                url: '/guardar_equipo_ups',
                type: 'POST',
                data: data,
                beforeSend: function(){
                  swal({
                    title: "Guardando",
                    text: "Espere un momento por favor...",
                    imageUrl:"/img/Spinner-1s-200px2.gif",
                    showConfirmButton: false,
                    allowOutsideClick: false
                  });
                }
              }).done(function(data){
                swal({
                  title: "¡SAPMA!",
                  text: "Equipo guardado correctamente",
                  type: "success",
                  confirmButtonText: "Aceptar",
                  allowOutsideClick: false
                });	

                setTimeout(function () {
                  window.location.reload();
                }, 1000);
              
              })
            }
            }
          );
        }
      });
  
});
  