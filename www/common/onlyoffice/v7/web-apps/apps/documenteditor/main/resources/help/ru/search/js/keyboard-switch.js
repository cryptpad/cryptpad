$(function(){
    function shortcutToggler(enabled,disabled,enabled_opt,disabled_opt){
        var selectorTD_en = '.keyboard_shortcuts_table tr td:nth-child(' + enabled + ')',
            selectorTD_dis = '.keyboard_shortcuts_table tr td:nth-child(' + disabled + ')';
            $(disabled_opt).removeClass('enabled').addClass('disabled');
            $(enabled_opt).removeClass('disabled').addClass('enabled');
            $(selectorTD_dis).hide();
            $(selectorTD_en).show().each(function() {
                if($(this).text() == ''){
                    $(this).parent('tr').hide();
                } else {
                    $(this).parent('tr').show();
                }
            });
    }
    if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
        shortcutToggler(3,2,'.mac_option','.pc_option');
        $('.mac_option').removeClass('right_option').addClass('left_option');
        $('.pc_option').removeClass('left_option').addClass('right_option');
    } else {
        shortcutToggler(2,3,'.pc_option','.mac_option');
    }
    $('.shortcut_toggle').on('click', function() {
        if($(this).hasClass('mac_option')){
            shortcutToggler(3,2,'.mac_option','.pc_option');
        } else if ($(this).hasClass('pc_option')){
            shortcutToggler(2,3,'.pc_option','.mac_option');
        }
    });
});