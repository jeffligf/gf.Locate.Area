;
(function ($, window, document, undefined) {
    //'use strict';
    var pluginName = 'gfLocateArea'; //Plugin名稱
    var gfLocateArea;

    $.ajax({
        url: 'node_modules/select2/dist/css/select2.min.css',
        dataType: 'text',
        cache: true
    }).then(function(data){
        var style = $('<style/>',{ 'text': data });
        $('head').append(style);
    });
    $.ajax({
        url: 'node_modules/gf.locate.area/src/css/gf.Locate.Area.css',
        dataType: 'text',
        cache: true
    }).then(function(data){
        var style = $('<style/>',{ 'text': data });
        $('head').append(style);
    });
    //Load dependencies first
    $.when(
        $.ajax({
            url: 'node_modules/select2/dist/js/select2.min.js',
            dataType: 'script',
            cache: true
        })
    )
    .done(function(){
        //建構式
        gfLocateArea = function (element, options) {

            this.target = element; //html container
            //this.prefix = pluginName + "_" + this.target.attr('id'); //prefix，for identity
            this.opt = {};
            var initResult = this._init(options); //初始化
            if (initResult) {
                //初始化成功之後的動作
                this._style();
                this._event();
                this._subscribeEvents();

                this.target.trigger('onInitComplete');
            }
        };

        //預設參數
        gfLocateArea.defaults = {
            url: 'http://d32015.swcb.gov.tw/d32d/commons/',
            css: {
                'width': '100%',

                'background-color': '#e3f0db',
                'overflow-y': 'hidden',
                'overflow-x': 'hidden',
            },

            onClick: undefined,
            onInitComplete: undefined

        };

        //方法
        gfLocateArea.prototype = {
            //私有方法
            _init: function (_options) {
                //合併自訂參數與預設參數
                try {
                    this.opt = $.extend(true, {}, gfLocateArea.defaults, _options);
                    return true;
                } catch (ex) {
                    return false;
                }
            },
            _style: function () {
                var o = this;
                o.target.css(o.opt.css);

                var row1 = $('<div/>', { 'class': 'gfLocateArea-Row' });
                var lbl1 = $('<label/>', { 'class': 'gfLocateArea-Label', 'text': '縣市' });
                var sel1 = $('<select/>', { 'class': 'gfLocateArea-Select gfLocateArea-Select1' });
                o._getOption({ url: 'getCity/addrname1/addrname1' }, "id", "name", sel1);
                row1.append(lbl1);
                row1.append(sel1);

                var row2 = $('<div/>', { 'class': 'gfLocateArea-Row' });
                var lbl2 = $('<label/>', { 'class': 'gfLocateArea-Label', 'text': '鄉鎮市區' });
                var sel2 = $('<select/>', { 'class': 'gfLocateArea-Select gfLocateArea-Select2' });
                row2.append(lbl2);
                row2.append(sel2);

                var row3 = $('<div/>', { 'class': 'gfLocateArea-Row' });
                var lbl3 = $('<label/>', { 'class': 'gfLocateArea-Label', 'text': '村里' });
                var sel3 = $('<select/>', { 'class': 'gfLocateArea-Select gfLocateArea-Select3' });
                row3.append(lbl3);
                row3.append(sel3);

                var row4 = $('<div/>', { 'class': 'gfLocateArea-Row' });
                var btn4 = $('<button/>', { 'class': 'gfLocateArea-Button', 'text': '定位' });
                row4.append(btn4);

                o.target.append(row1);
                o.target.append(row2);
                o.target.append(row3);
                o.target.append(row4);

                sel1.select2();
                sel2.select2();
                sel3.select2();
            },
            _event: function () {
                var o = this;
                o.target
                    .find('.gfLocateArea-Select1')
                        .change(function(e){
                            o.target.find('.gfLocateArea-Select2').empty();
                            o.target.find('.gfLocateArea-Select3').empty();
                            o._getOption({ url: 'getTown/' + o.target.find('.gfLocateArea-Select1').val() + '/addrname2/addrname2' }, "id", "name", o.target.find('.gfLocateArea-Select2'));
                        })
                        .end()
                    .find('.gfLocateArea-Select2')
                        .change(function(e){
                            o.target.find('.gfLocateArea-Select3').empty();
                            o._getOption({ url: 'getVillage/' + o.target.find('.gfLocateArea-Select1').val() + '/' + o.target.find('.gfLocateArea-Select2').val() + '/addrname3/addrname3' }, "id", "name", o.target.find('.gfLocateArea-Select3'));
                        })
                        .end()
                    .find('.gfLocateArea-Button')
                        .click(function(e){
                            o._getLatLng({
                                city: o.target.find('.gfLocateArea-Select1').val(),
                                town: o.target.find('.gfLocateArea-Select2').val(),
                                village: o.target.find('.gfLocateArea-Select3').val()
                            });
                        })
                        .end()
            },

            _getOption: function(_data, _valueField, _textField, _container){
                var o = this;
                $.ajax({
                    url: o.opt.url + _data.url,
                    type: 'GET',
                    dataType: 'xml',
                    success: function(res){
                        var defaultOption = $('<option/>', { value: "請選擇", text: "請選擇" });
                        _container.append(defaultOption);

                        $(res).find("marker").each(function(i){
                            var option = $('<option/>', { value: $(this).attr(_valueField), text: $(this).attr(_textField) });
                            _container.append(option);
                        });
                        _container.select2();
                    }
                })
            },
            _getLatLng: function(_data){
                var o = this;
                var geocodeLocation = _data.city + _data.town + _data.village;
                if(geocodeLocation.indexOf("臺") != -1){
                    geocodeLocation = "台"+geocodeLocation.substring(1);
                }
                var geocoderService = new google.maps.Geocoder();
                geocoderService.geocode({'address': geocodeLocation}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var latlng = results[0].geometry.location;
                        o.target.trigger("onClick", {
                            x: latlng.lng() * 1,
                            y: latlng.lat() * 1,
                            content:
                                o.target.find('.gfLocateArea-Select1 option:selected').text() + " > " +
                                o.target.find('.gfLocateArea-Select2 option:selected').text() + " > " +
                                o.target.find('.gfLocateArea-Select3 option:selected').text() + "<br />" +
                                "( " + latlng.lng() + " , " + latlng.lat() + " )"
                        });
                    }
                });
            },
            //註冊事件接口
            _subscribeEvents: function () {
                //先解除所有事件接口
                this.target.off('onClick');
                this.target.off('onInitComplete');
                //綁定點擊事件接口
                if (typeof (this.opt.onClick) === 'function') {
                    this.target.on('onClick', this.opt.onClick);
                }
                if (typeof (this.opt.onInitComplete) === 'function') {
                    this.target.on('onInitComplete', this.opt.onInitComplete);
                }
            }



        };
    });

    //實例化，揭露方法，回傳
    $.fn[pluginName] = function (options, args) {
        var gfInstance;
        this.each(function () {
            gfInstance = new gfLocateArea($(this), options);
        });

        return this;
    };
})(jQuery, window, document);