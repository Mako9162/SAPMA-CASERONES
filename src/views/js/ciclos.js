$(document).ready(function() {
    
    $("[name^='radio-']").change(function() {
        
        $("[name^='radio-']").prop("checked", false);
        
        var selectedValue = $(this).val();
        
        $(this).prop("checked", true);
     
        if (selectedValue === "1") {
            $("#TD").show();
            $("#TDN").show();
            $("#borde").show();
        } else if (selectedValue === "2") {
            $("#TD").hide();
            $("#TDN").hide();
            $("#borde").show();
        } else if (selectedValue === "3") {

        } else if (selectedValue === "4") {

        }

    });

});
