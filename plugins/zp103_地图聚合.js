function onInit({ exc, id, props }) {
    exc('load("https://map.qq.com/api/gljs?v=1.exp&key=GC2BZ-B7C3X-DM44X-ZHAZM-JP5WE-VHFR4")', null, () => {
        init(id, exc, props)
    })
}

function init(id, exc, { center, zoom = 11, LatLng, onClick, showControl = true }) {
    if (!Array.isArray(LatLng) || !Array.isArray(LatLng[0])) LatLng = []
    var option = { zoom, showControl }
    if (Array.isArray(center)) option.center = new TMap.LatLng(center[0], center[1])
    var map = new TMap.Map(document.getElementById(id), option)
    var markerCluster = new TMap.MarkerCluster({
        map,
        enableDefaultStyle: false, // 关闭默认样式
        minimumClusterSize: 4, // 形成聚合簇的最小个数
        geometries: LatLng.map((a, i) => { // 点数组
            return { id: i, position: new TMap.LatLng(a[0], a[1]) }
        }),
        zoomOnClick: true, // 点击簇时放大至簇内点分离
        gridSize: 60, // 聚合算法的可聚合距离
        averageCenter: false, // 每个聚和簇的中心是否应该是聚类中所有标记的平均值
        // maxZoom: 20 // 采用聚合策略的最大缩放级别
    })

    var clusterBubbleList = []
    var markerGeometries = []
    var marker = null

    markerCluster.on("cluster_changed", function(e) { // 监听聚合簇变化        
        if (clusterBubbleList.length) { // 销毁旧聚合簇生成的覆盖物
            clusterBubbleList.forEach(item => item.destroy())
            clusterBubbleList = []
        }
        markerGeometries = []
        var clusters = markerCluster.getClusters()
        clusters.forEach(function(item) { // 根据新的聚合簇数组生成新的覆盖物和点标记图层
            if (item.geometries.length > 1) {
                let clusterBubble = new ClusterBubble({
                    map,
                    position: item.center,
                    content: item.geometries.length,
                })
                clusterBubble.on("click", () => {
                    map.fitBounds(item.bounds)
                })
                clusterBubbleList.push(clusterBubble)
            } else {
                markerGeometries.push({
                    id: item.geometries[0].id,
                    position: item.center
                })
            }
        })

        if (marker) { // 已创建过点标记图层，直接更新数据
            marker.setGeometries(markerGeometries)
        } else { // 创建点标记图层
            marker = new TMap.MultiMarker({
                map,
                styles: {
                    default: new TMap.MarkerStyle({ "width": 34, "height": 42, "anchor": { x: 17, y: 21, }, "src": "https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/marker_blue.png", })
                },
                geometries: markerGeometries
            })
            marker.on("click", e => {
                exc(onClick[e.geometry.id])
            })
        }
    })

    function ClusterBubble(options) {
        TMap.DOMOverlay.call(this, options)
    }
    ClusterBubble.prototype = new TMap.DOMOverlay()
    ClusterBubble.prototype.onInit = function(options) {
        this.content = options.content
        this.position = options.position
    }
    ClusterBubble.prototype.onDestroy = function() { // 销毁时需要删除监听器
        this.dom.removeEventListener("click", this.onClick)
        this.removeAllListeners()
    }
    ClusterBubble.prototype.onClick = function() {
        this.emit("click")
    }
    ClusterBubble.prototype.createDOM = function() { // 创建气泡DOM元素
        var dom = document.createElement("div")
        dom.classList.add("clusterBubble")
        dom.innerText = this.content
        dom.style.cssText = [
            "width: " + (40 + parseInt(this.content) * 2) + "px;",
            "height: " + (40 + parseInt(this.content) * 2) + "px;",
            "line-height: " + (40 + parseInt(this.content) * 2) + "px;",
        ].join(" ")
        this.onClick = this.onClick.bind(this) // 监听点击事件，实现zoomOnClick
        dom.addEventListener("click", this.onClick)
        dom.addEventListener("touchstart", this.onClick)
        return dom
    }
    ClusterBubble.prototype.updateDOM = function() {
        if (!this.map) return
        let pixel = this.map.projectToContainer(this.position) // 经纬度坐标转容器像素坐标
        // 使文本框中心点对齐经纬度坐标点
        let left = pixel.getX() - this.dom.clientWidth / 2 + "px"
        let top = pixel.getY() - this.dom.clientHeight / 2 + "px"
        this.dom.style.transform = `translate(${left}, ${top})`
    }
}




const css = `
.zp103 .clusterBubble {
    border-radius: 50%;
    color: #fff;
    font-weight: 500;
    text-align: center;
    opacity: 0.88;
    background-image: linear-gradient(139deg, #4294FF 0%, #295BFF 100%);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.20);
    position: absolute;
    top: 0px;
    left: 0px;
}`

$plugin({
    id: "zp103",
    props: [{
        prop: "center",
        type: "text",
        label: "中心点经纬度",
        ph: "[纬度Lat, 经度Lng]"
    }, {
        prop: "LatLng",
        type: "text",
        label: "经纬度数组",
        ph: "[[纬度, 经度], [Lat, Lng], ...]"
    }, {
        prop: "onClick",
        type: "text",
        label: "onClick数组",
        ph: "marker点击事件"
    }, {
        prop: "zoom",
        type: "text",
        label: "缩放级别",
        ph: "3～20"
    }, {
        prop: "showControl",
        type: "switch",
        label: "显示控件"
    }],
    onInit,
    css
})