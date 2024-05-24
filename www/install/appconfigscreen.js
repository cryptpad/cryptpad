

define([
    'jquery',

    '/common/inner/sidebar-layout.js',
    '/customize/messages.js',
    '/common/hyperscript.js',

    '/common/hyperscript.js',
    'css!/lib/datepicker/flatpickr.min.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/admin/app-admin.less',
], function(
    $,
    Sidebar,
    Messages,
    h,

) {

    //XXX
    Messages.admin_appSelection = 'App configuration saved'
    Messages.admin_appsTitle = "Choose your applications"
    Messages.admin_appsHint = "Choose which apps are available to users on your instance."
    Messages.admin_cat_apps = "Apps"

    const blocks = Sidebar.blocks;
    const grid = blocks.block([], 'cp-admin-customize-apps-grid');

    const allApps = ['pad', 'code', 'kanban', 'slide', 'sheet', 'form', 'whiteboard', 'diagram'];
    const availableApps = []
        
    function select(app) {
        if (availableApps.indexOf(app) === -1) {
            availableApps.push(app);
            $(`#${app}-block`).attr('class', 'active-app') 
        } else {
            availableApps.splice(availableApps.indexOf(app), 1)
            $(`#${app}-block`).attr('class', 'inactive-app')
        } 
    }

    allApps.forEach(app => { 
        let appBlock = h('div',  {style: 'width:50%;height:20px;float:left;border:1px solid red'}, {class: 'inactive-app', id: `${app}-block`}, app)
        $(appBlock).addClass('cp-app-drive-element-grid')
        $(appBlock).addClass('cp-app-drive-element-row')
        $(appBlock).addClass('cp-app-drive-new-doc')

        $(grid).append(appBlock);
        $(appBlock).on('click', () => select(app))
    }); 
    

    return [availableApps, grid]

});

