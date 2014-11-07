define (require, exports, module)->
  Engine = require("famous/core/Engine")
  Transform = require("famous/core/Transform")
  Modifier = require("famous/core/Modifier")
  Surface = require("famous/core/Surface")
  ContainerSurface = require("famous/surfaces/ContainerSurface")
  Transitionable = require("famous/transitions/Transitionable")
  ImageSurface = require("famous/surfaces/ImageSurface")
  Easing = require("famous/transitions/Easing")
  Scrollview = require("famous/views/Scrollview")
  Timer = require("famous/utilities/Timer")
  RenderNode = require("famous/core/RenderNode")
  EventHandler = require('famous/core/EventHandler')
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
  sort_transition = {
    method: 'wall',
    period: 750,
    dampingRatio: 0.8
  };



   #method to draw individual bars
  class Bar
    constructor: (options={}) ->
      the= this
      @d= options.d || {value:0, label:""}
      @i= options.i
      @graph= options.graph
      @killed=false
      @s = new Surface(
        size: [undefined, undefined]
        content:@d.label||@d.value
        properties:
          backgroundColor: @d.color || "steelblue"
          overflow:"hidden",
          textAlign: "right"
          color: "white"
          "font-size": "10px"
      )
      @compute()
      @s.on 'mouseenter', ->
        if the.graph.show_label
          the.show_label()
        the.focus()

      @s.on 'mouseout', ->
        if the.graph.show_label
          the.hide_label()
        the.unfocus()

      @s.on 'click', ->
        if the.killed
          the.unkill_others()
        else
          the.kill_others()

      @mod = new Modifier(
        origin: @origin
        transform: Transform.translate(@x, @y)
        size: [0.1, 0.1]
        opacity: 0.8
      )
      @mod.setSize [@w, @h], wall_transition
      @graph.node.add(@mod).add(@s)

      ##label logic
      @label_mod = new Modifier(
        origin: @origin
        transform: Transform.translate(@x, @y)
        size:[0.1,0.1]
      )
      label= new Surface({
        content:@d.label||''
        properties:{
          color:"#5c6056"
          "z-index":"4"
          overflow:"hidden"
          # "text-shadow":"1px 1px grey";
          # border:"1px solid grey"
        }
        })
      @graph.node.add(@label_mod).add(label)


    compute:()->
      the= this
      if @graph.type=="vertical_bar"
        @y= 0
        @h= @graph.y_scale.linear(the.d.value)
        @x= @graph.x_scale.linear(the.i)
        @w= @graph.x_scale.linear(1) - 1
        the.s.setProperties({"font-size":"11px", "text-align":"left"})
        @origin=[0,1]
        if @graph.align=="middle"
          @origin=[0,0.5]
        if @graph.align=="end"
          @origin=[0,0]
        if @graph.hidden
          @h=0.1

      else if @graph.type=="horizontal_bar"
        @x= 0
        @y= -@graph.y_scale.linear(the.i)
        @h= @graph.y_scale.linear(1) - 1
        @w= @graph.x_scale.linear(the.d.value)
        the.s.setProperties({"font-size":"11px", "text-align":"left"})
        @origin=[0,1]
        if @graph.align=="middle"
          @origin=[0.5,1]
        if @graph.align=="end"
          @origin=[1,1]
        if @graph.hidden
          @w=0.1

      else if @graph.type=="area_bar"
        if the.i==0
          already= 0
        else
          already= [0..(the.i-1)].reduce((h,i)->
            return h+the.graph.data[i].value
          ,0)
        @x= @graph.x_scale.linear(already)
        @w= @graph.x_scale.linear(the.d.value)
        @y= 0
        @h= 50
        @origin=[0,1]
        the.s.setProperties({"font-size":"11px", "text-align":"left"})
        if @graph.align=="middle"
          @origin=[0,0.5]
        if @graph.align=="end"
          @origin=[0,0]
        if @graph.hidden
          @h=0.1

      else if @graph.type=="treemap"
        @x= the.d.x
        @y= the.d.y
        @h= the.d.dy
        @w= the.d.dx
        the.s.setProperties({"font-size":"20px", "text-align":"center"})
        @origin=[0,0]
        if @graph.hidden
          @h=0.1
      # if the.label_mod
        # the.label_mod.setOrigin(@origin)

    draw: (transition=wall_transition, cb=->)->
      the= this
      the.mod.setOrigin(the.origin, transition)
      the.mod.setTransform(Transform.translate(the.x, the.y), transition)
      the.mod.setSize([the.w, the.h], transition, cb)
      the.draw_label()
      # Timer.after(->
      # ,20)

    draw_label:->
      the= this
      if @graph.type=="vertical_bar"
        x= @x
        y= -@h
        if !@graph.bars[@i+1]
          x -= 50  #it's at the end
        if @origin[1]!=1
          y= -@graph.height/1.5
      if @graph.type=="horizontal_bar"
        x= @w
        y= @y
        if @origin[0]!=0
          x= @graph.width/2
        if x + 100 > the.graph.width
          x= the.graph.width - 120
      if @graph.type=="area_bar"
        x= @x
        y= @y - 60
        if @origin[1]==0
          y= -@graph.width/2
        if @origin[1]==0.5
          y= -(@graph.width/2) + 30
        if !@graph.bars[@i+1]
          x -= 50  #it's at the end
      if @graph.type=="treemap"
        x= @d.dx
        y= @d.dy
      @label_mod.setTransform(Transform.translate(x, y), wall_transition)

    hide_label:->
      if !@killed
        @label_mod.setSize([0.1,0.1])

    show_label:->
      if !@killed
        @label_mod.setSize([100,20])


    focus:()->
      if !@killed
        if @graph.type=="vertical_bar" || @graph.type=="area_bar"
          x= @w
          y= @h + 3
        if @graph.type=="horizontal_bar"
          x= @w + 3
          y= @h
        if @graph.type=="treemap"
          x= @d.dx
          y= @d.dy
          @mod.setOpacity(1.0)
        @mod.setSize [x, y], {duration:100}

    unfocus:()->
      if !@killed
        @mod.setSize [@w, @h], {duration:100}
      @mod.setOpacity(0.8)

    kill:->
      the= this
      the.killed= true
      if @graph.type=="vertical_bar" || @graph.type=="area_bar"
        the.mod.setSize [the.w, the.h * 0.1], wall_transition
      if @graph.type=="horizontal_bar"
        the.mod.setSize [the.w * 0.1, the.h], wall_transition
      if @graph.type=="treemap"
        the.mod.setSize [the.w * 0.2, the.h * 0.2], wall_transition

    unkill:->
      the= this
      the.killed= false
      the.draw()
      Timer.after ->
        the.hide_label()
      ,5

    kill_others:->
      the= this
      the.graph.bars.forEach (b,i)->
        b.killed= true
        if b.i != the.i
          b.kill()

    unkill_others:->
      the= this
      the.graph.bars.forEach (b,i)->
        b.unkill()

    sort_to:(i, transition=sort_transition, cb=->)->
      @i=i
      @compute()
      @draw(transition, cb)



  class Graph
    the= this
    constructor:(options={})->
      @data = options.data || []
      @width = options.width || 400
      @height = options.height || 400
      @bars=[]
      @align= options.align || "start"
      @type= options.type || "vertical_bar"
      @show_labels= options.show_labels || true
      @hidden= (options.hidden!=null && options.hidden==true)
      @label_size=50
      @node= new ContainerSurface({
        size:[@width, @height],
        properties:{
          overflow:"hidden"
          border:"1px solid steelblue"
          "border-radius": "2px",
        }
      })
      @compute()
      @bars= @data.map (d,i)->
        new Bar({
           graph:the,
           d:d,
           i:i
          })
      @draw()

    reset_data:(new_data=[])->
      the= this
      @data= new_data
      new_labels= {}
      new_data.forEach (o)->
        new_labels[o.label]=o.value
      #kill dead ones
      the.bars= the.bars.map (b)->
        if new_labels[b.d.label]==null
          return null
        b.d.value= new_labels[b.d.label]
        delete new_labels[b.d.label]
        return b
      the.bars= the.bars.filter (b)-> return b
      #add new ones
      Object.keys(new_labels).forEach (l)->
        # d= new_data.find (o)->o.label==l
        d= {value:new_labels[l], label:l}
        b= new Bar(({graph:the.graph, i:the.bars.length, d:d}))
        the.bars.push(b)


    update:(options={})->
      options.transition= options.transition || wall_transition
      if options.data
        # @reset_data(options.data)
        @data= options.data
      #do container resizes beforehand
      if options.width || options.height
        if options.width!=undefined
          @width= options.width
        if options.height != undefined
          @height= options.height
        @node.setSize([@width, @height])#should animate this maybe
      if options.hidden==null
        options.hidden= false

      @width = options.width || @width
      @height = options.height || @height
      @align = options.align || @align
      @type= options.type || @type
      @hidden= options.hidden
      @compute()
      @draw(options.transition)

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
          size:[0, the.height - @label_size],
          range:[0, max],
          })
      else if the.type=="horizontal_bar"
        the.x_scale= new Scale({
          size:[0, the.width - @label_size],
          range:[0, max],
          })
        the.y_scale= new Scale({
          size:[0, the.height],
          range:[0, the.data.length],
          })
      else if the.type=="area_bar"
        sum= the.data.reduce( (h,s)->
          return h+s.value
        , 0)
        the.x_scale= new Scale({
          size:[0, the.width],
          range:[0, sum],
          })
        the.y_scale= new Scale({
          size:[0, the.height - @label_size],
          range:[0, 100],
          })
      else if the.type=="treemap"
        #wrap d3's wicked layout algorithm
        treemap = d3.layout.treemap().size([the.width, the.height]).sticky(true).value (d)->
          return d.value
        obj = {
          children: the.data
        }
        arr = treemap(obj)
        arr = arr.slice(1, arr.length) #remove pesky top one
        the.data= arr
        the.x_scale= {}
        the.y_scale= {}



      @bars.forEach (bar,i)->
        bar.d= the.data[i]
        bar.compute(i)

    build:->
      return @node
    draw:->
      @bars.forEach (bar,i)->
        Timer.after(-> #stagger the animation
          bar.draw()
        , i)

    append:(obj={})->
      the= this
      obj.value= obj.value||0
      obj.color= obj.color||"rgba(42,111,180,0.7)"
      the.data.push(obj)
      @compute()
      b= new Bar(({graph:g, i:the.bars.length, d:obj}))
      @bars.push(b)
      @update()
      @update()
    show:->
      @update({hidden:false})
    hide:->
      @update({hidden:true})
    resize:(obj={})->
      @update(obj)
    align:(l="start")->
      l= "start" if l=="left"
      l= "end" if l=="right"
      l= "middle" if l=="center"
      l= "end" if l=="top"
      l= "start" if l=="bottom"
      @update({align:true})

    update_order:->
      @bars.forEach (b, l) ->
        Timer.after(-> #stagger the animation
          b.sort_to(l)
        , l*1.5)
        data[l]= b.d


    sort:(fn)->
      if !fn || typeof fn=="string"
        fn= (a, b) ->
          if b.d.value > a.d.value
            return 1
          if b.d.value == a.d.value
            return 0
          return -1
      @bars = @bars.sort(fn)
      if fn=="desc"
        @bars= @bars.reverse()
      #some graphs need to be re-computed
      if @type=="area_bar" || @type=="treemap"
        @compute()
      @update_order()

    randomize:()->
      @sort(->Math.round(Math.random()))

    random_walk:()->
      the= this
      @bars.forEach (bar,l) ->
        duration= Math.random()*2500+1000
        transition= {duration:duration}
        spot= Math.random()*the.bars.length
        bar.sort_to(spot, transition, ->
          bar.sort_to(l, transition)#return
        )

    wave:(amount=1.2)->
      the= this
      transition= {duration:200}
      @bars.forEach (bar,l) ->
        Timer.after(-> #stagger the animation
          if the.type=="vertical_bar"|| the.type=="area_bar"
            bar.mod.setSize [bar.w, bar.h*amount], transition, ->
              bar.mod.setSize [bar.w, bar.h], transition
          else if the.type=="treemap"
            bar.mod.setSize [bar.w*amount, bar.h*amount], transition, ->
              bar.mod.setSize [bar.w, bar.h], transition
          else
            bar.mod.setSize [bar.w*amount, bar.h], transition, ->
              bar.mod.setSize [bar.w, bar.h], transition
        , l*1.4)

  window.Bar= Bar
  module.exports = Graph;
