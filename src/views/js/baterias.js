$(document).ready(function () {

  $(".inputClass").on("blur", function () {
    var valor = $(this).val();
    var valorSinEspacios = valor.replace(/\s+$/, "");
    $(this).val(valorSinEspacios);
  });

  $(".inputClass1").on("input", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9.]/g, "")
    );

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

  function initDataTable() {
    table = $("#tabla_bat").DataTable({
      searching: true,
      lengthChange: false,
      colReorder: true,
      select: {
        style: "single",
      },
      dom: 'f<"botones">rtip',
      bDestroy: true,
      scrollX: true,
      bInfo: true,
      iDisplayLength: 8,
      autoWidth: false,
      createdRow: function(row, data, dataIndex) {

        var estado = data[8];

        if (estado === "Inactivo") {
            $(row).addClass('gris-claro'); 
        }
      },
      language: {
        sProcessing: "Procesando...",
        sLengthMenu: "Mostrar _MENU_ registros",
        sZeroRecords: "No se encontraron resultados",
        sEmptyTable: "Ningún dato disponible",
        sInfo: "Mostrando un total de _TOTAL_ registros",
        sInfoEmpty: "Mostrando un total de 0 registros",
        sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
        sInfoPostFix: "",
        sSearch: "Buscar:",
        sUrl: "",
        sInfoThousands: ".",
        sLoadingRecords: "Cargando...",
        oPaginate: {
          sFirst: "Primero",
          sLast: "Último",
          sNext: "Siguiente",
          sPrevious: "Anterior",
        },
        oAria: {
          sSortAscending:
            ": Activar para ordenar la columna de manera ascendente",
          sSortDescending:
            ": Activar para ordenar la columna de manera descendente",
        },
        select: {
          rows: {
            _: "Has seleccionado %d filas",
            0: "Click en una fila para seleccionar",
            1: "Has seleccionado 1 fila",
          },
        },
      },
    });

    $("div.botones").html(
      '<button id="editar" class="btn btn-inline btn-warning btn-sm">' +
      '<i class="fa fa-edit"></i></button>'
    );
  }

  initDataTable();

  $("#agregar").on("click", function () {
    var marca = $("#marca").val();
    var modelo = $("#modelo").val();
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

  $("#editar").on("click", function () {
    var selectedRowsData = table.rows({ selected: true }).data().toArray();

    if (selectedRowsData.length === 0) {
      swal("Error", "Debe seleccionar una fila", "error");
      return;
    }

    const id = selectedRowsData[0][0];
    const marca = selectedRowsData[0][1];
    const modelo = selectedRowsData[0][2];
    const capv = selectedRowsData[0][3];
    const capah = selectedRowsData[0][4];
    const imp = selectedRowsData[0][5];
    const tolg = selectedRowsData[0][6];
    const tolf = selectedRowsData[0][7];
    const act = selectedRowsData[0][8];

    $("#edit_bat_id").val(id);
    $("#edit_marca").val(marca);
    $("#edit_modelo").val(modelo);
    $("#edit_capacidad_v").val(capv);
    $("#edit_capacidad_ah").val(capah);
    $("#edit_impedancia_dsh").val(imp);
    $("#edit_tolerancia_g").val(tolg);
    $("#edit_tolerancia_f").val(tolf);
    $("#edit_activo").val(act);
    if (act.toLowerCase() === "activo") {
        $("#edit_act_desc").prop("checked", true);
    } else {
        $("#edit_act_desc").prop("checked", false);
    }

    $("#edit_bat").modal("show");

  });

  $("#actualizar").on("click", function () {
    const id = $("#edit_bat_id").val();
    const marca = $("#edit_marca").val();
    const modelo = $("#edit_modelo").val();
    const capv = $("#edit_capacidad_v").val();
    const capah = $("#edit_capacidad_ah").val();
    const imp = $("#edit_impedancia_dsh").val();
    const tolg = $("#edit_tolerancia_g").val();
    const tolf = $("#edit_tolerancia_f").val();
    var act = $("#edit_act_desc").is(":checked") ? 1 : 0;

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
      capv.trim() === "" ||
      capah.trim() === "" ||
      imp.trim() === "" ||
      tolg.trim() === "" ||
      tolf.trim() === ""
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

    const data = {
      id,
      marca,
      modelo,
      capv,
      capah,
      imp,
      tolg,
      tolf,
      act
    };

    swal(
      {
        title: "¡SAPMA!",
        text: "¿Desea actualizar esta batería?",
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
            url: "/act_bat",
            type: "POST",
            data: data,
            success: function (response) {
              swal({
                title: "¡SAPMA!",
                text: "La batería se ha actualizo correctamente.",
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
                text: "Ha ocurrido un error al intentar actualizar la batería. Por favor, inténtelo de nuevo más tarde.",
                type: "error",
                confirmButtonClass: "btn-primary",
                confirmButtonText: "Aceptar",
                closeOnConfirm: true,
              });
            },
          });
        }
      }
    );
  });

});
