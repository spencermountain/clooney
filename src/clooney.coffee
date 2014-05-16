define (require, exports, module)->
  Engine = require("famous/core/Engine")
  Transform = require("famous/core/Transform")
  Modifier = require("famous/core/Modifier")
  Surface = require("famous/core/Surface")
  ContainerSurface = require("famous/surfaces/ContainerSurface")
  Transitionable = require("famous/transitions/Transitionable")
  ImageSurface = require("famous/surfaces/ImageSurface")
  Easing = require("famous/transitions/Easing")
  GridLayout = require("famous/views/GridLayout")
  Scrollview = require("famous/views/Scrollview")
  Timer = require("famous/utilities/Timer")
  RenderNode = require("famous/core/RenderNode")
  EventHandler = require('famous/core/EventHandler')
  HeaderFooterLayout = require("famous/views/HeaderFooterLayout")
  RenderController = require("famous/views/RenderController");
  SequentialLayout = require("famous/views/SequentialLayout");
  View = require('famous/core/View');
  SpringTransition = require('famous/transitions/SpringTransition');
  WallTransition = require('famous/transitions/WallTransition');
  Transitionable.registerMethod('spring', SpringTransition);
  Transitionable.registerMethod('wall', WallTransition);
  window.mainContext = Engine.createContext()
  window.eventHandler = new EventHandler();
  wall_transition = {
    method: 'wall',
    period: 450,
    dampingRatio: 0.7
  };
  spring_transition = {
    method: 'spring',
    period: 450,
    dampingRatio: 0.7
  };

   #method to draw individual bars
  class Bar
    constructor: (options={}) ->
      @d= options.d || {value:0, label:""}
      @i= options.i
      @graph= options.graph
      @x=Math.random()*100
      @y=Math.random()*100
      @compute()
      s = new Surface(
        size: [undefined, undefined]
        content:@d.value||''
        properties:
          backgroundColor: "steelblue"
          border: "0.5px solid white"
          textAlign: "left"
          color: "white"
          "font-size": "10px"
      )
      @mod = new Modifier(
        origin: @origin
        transform: Transform.translate(@x, @y)
        size: [0.1, 0.1]
        opacity: 0.8
      )
      @graph.node.add(@mod).add(s)
      @mod.setSize [@w, @h], wall_transition

    compute:->
      the= this
      if @graph.type=="vertical_bar"
        @y= 0
        @h= @graph.y_scale.linear(the.d.value)
        @x= @graph.x_scale.linear(the.i)
        @w= @graph.x_scale.linear(1) - 1
        @origin=[0,1]
        if @graph.align=="middle"
          @origin=[0,0.5]
        if @graph.align=="end"
          @origin=[0,0]

      else if @graph.type=="horizontal_bar"
        @x= 0
        @y= -@graph.y_scale.linear(the.i)
        @h= @graph.y_scale.linear(1) - 1
        @w= @graph.x_scale.linear(the.d.value)
        @origin=[0,1]
        if @graph.align=="middle"
          @origin=[0.5,1]
        if @graph.align=="end"
          @origin=[1,1]
      console.log @h

    show: ->
      the= this
      the.mod.setOrigin(the.origin, wall_transition)
      the.mod.setTransform(Transform.translate(the.x, the.y), wall_transition)
      the.mod.setSize([the.w, the.h], wall_transition)



  class Graph
    the= this
    constructor:(options={})->
      @data = options.data || []
      @width = options.width || 400
      @align= options.align || "start"
      @height = options.height || 400
      @bars=[]
      @type= options.type || "vertical_bar"
      @compute()
      @node= new ContainerSurface({
        size:[@width, @height],
        properties:{
          overflow:"hidden"
          border:"1px solid steelblue"
          "border-radius": "2px",
        }
      })
      @bars= @data.map (d,i)->
        new Bar({
           graph:the,
           d:d,
           i:i
          })
      @show()

    update:(options)->
      @data= options.data || @data
      @width = options.width || @width
      @height = options.height || @height
      @align = options.align || @align
      @type= options.type || @type
      @compute()
      @show()

    compute: ->
      the= this
      values= the.data.map (d)->d.value
      max = Math.max.apply(Math, values)
      #set values for vertical barchart
      if the.type=="vertical_bar"
        the.x_scale= new Scale({
          size:[0, the.width],
          range:[0, the.data.length],
          })
        the.y_scale= new Scale({
          size:[0, the.height],
          range:[0, max],
          })
      else if the.type=="horizontal_bar"
        the.x_scale= new Scale({
          size:[0, the.width],
          range:[0, max],
          })
        the.y_scale= new Scale({
          size:[0, the.height],
          range:[0, the.data.length],
          })
      @bars.forEach (bar,i)->
        bar.d= the.data[i]
        bar.compute()


    build:->
      return @node
    show:->
      @bars.forEach (bar)->
        bar.show()


  module.exports = Graph;
