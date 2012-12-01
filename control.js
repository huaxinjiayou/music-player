(function(){
    var preSym = "song-"
    var template = '<li class="odd" id="song-$id" data-id="$id">$name<span class="delete" title="delete">X</span><span>$duration</span></li>';
    
    var callFunc = function(cb, thisObj){
        return function(){
            cb.apply(thisObj, arguments);
        }
    }
   

    function Control(){
        this.init();
    }

    Control.prototype = {
        constructor: Control,

        init: function(){

            var player = window.player({
                lrcCanvas: $("#lrc"),
                currentClass: "cur"
            });
            this.player = player;

            this.addEvent();
            var self = this;
            var action = this.action;

            
            $("#file").bind("change", function(event){
                var file = this;
                player.chooseFile(event, function(list){
                    var result = [];
                    $.each(list, function(i, v){
                        result.push(action.replace(v, self));
                    });

                    var result = $(result.join(""));
                    $("#list").append(result);

                    $("#list li:nth-child(2n)").removeClass("odd");
                    $("#list li:nth-child(2n +1)").addClass("odd");

                    // how to clear ?
                });
            });

            this.duration = $("#duration").width();
            this.durationPro = $("#duration div");
            player.addPlayEvent(function(){
                var width = action.getRightVal(player.getDuration(), player.getProgress(), self.duration);
                self.durationPro.width(width);
                self.durationPro.html(player.getFormProgress() + "/" + player.getFormDuration());
            });

            this.volume = $("#volume").height();
            this.volumeNow = $("#volume div");
            this.volumeNow.height(action.getRightVal(100, player.getVolume(), this.volume));
            this.volumeNow.html(parseInt(player.getVolume()));

            player.orderPlay(callFunc(this.action.loopCb, this));
        },

        action: {
            pre: function(event, self){
                var player = self.player;
                var action = self.action;

                action.removeSelect(player.currentId);
                player.playPre();
                action.addSelect(player.currentId);
            },

            next: function(event, self) {
                var player = self.player;
                var action = self.action;
                
                action.removeSelect(player.currentId);
                player.playNext();
                action.addSelect(player.currentId);
            },

            play: function(event, self){
                var player = self.player;
                var id = this.attr("data-id");

                self.action.removeSelect(player.currentId);
                this.addClass("selected");

                player.playSongById(+id);

                var play = $("#control .play");
                play.html("PAUSE");
                play.data("status", "play");
            },

            delete: function(event, self){
                var player = self.player;
                event.stopPropagation();
                var parent = this.parent();
                var id = parent.attr("data-id");

                if(id == player.currentId){
                    if(player.playList.length > 1){
                        self.action.next(event, self);
                    } else{
                        player.stop();
                    }   
                }
                player.deleteSong(id);
                parent.remove();
            },

            togglePlay: function(event, self){
                var player = self.player;
                var id = player.currentId;

                var status = this.data("status");
                if(status === "play"){
                    player.pause();
                    this.html("PLAY");
                    this.data("status", "pause");
                } else{
                    if(status !== "pause"){
                        if(player.playList.length === 0){
                            return;
                        }
                        var song = player.playList[0]
                        player.loadSong(song);
                        self.action.addSelect(song.id)
                        id = song.id;
                    }
                    player.play(id);
                    this.html("PAUSE");
                    this.data("status", "play");
                }
            },

            loop: function(event, self){
                var player = self.player;
                var status = this.data("status");
                var _this = this;

                var actions = {
                    loop: function(){
                        _this.html("RANDOM");
                        _this.data("status", "random");
                        player.randomPlay(callFunc(self.action.loopCb, self));
                    },
                    random: function(){
                        _this.html("ORDER");
                        _this.data("status", "order");
                        player.orderPlay(callFunc(self.action.loopCb, self));
                    },
                    order: function(){
                        _this.html("LOOP");
                        _this.data("status", "loop");
                        player.loopPlay();
                    }
                }

                actions[status || "order"]();
            },

            muted: function(event, self){
                var status = this.data("status");
                if(status == "muted"){
                    self.action.unmuted(self);
                } else{
                    self.player.muted();
                    this.html("UNMUTED");
                    this.data("status", "muted");
                }
            },

            jump: function(event, self){
                var player = self.player;
                if(!player.currentId){
                    return;
                }
                if(!self.duration){
                    self.duration = $("#duration").width();
                }
                if(!self.durationPro){
                    self.durationPro = $("#duration div");    
                }
                
                player.jump(self.action.getRightVal(self.duration, event.offsetX, player.getDuration()));
                self.durationPro.width(event.offsetX);
            },

            setVolume: function(event, self){
                var player = self.player;
                if(!self.volume){
                    self.volume = $("#volume").height();
                }
                if(!self.volumeTop){
                    self.volumeTop = $("#volume").offset().top;
                }
                if(!self.volumeNow){
                    self.volumeNow = $("#volume div");
                }

                var height = self.volume - (event.clientY - self.volumeTop)
                player.setVolume(self.action.getRightVal(self.volume, height, 100));
                self.volumeNow.height(height);
                self.action.unmuted(self);
                self.volumeNow.html(parseInt(player.getVolume()));
            },

            setMaxVoluem: function(event, self){
                var player = self.player;
                player.setVolume(100);
                self.volumeNow.height(self.volume);
                self.action.unmuted(self);
                self.volumeNow.html(parseInt(player.getVolume()));
            },

            replace: function(obj, self){
                return template.replace(/\$id/g, obj.id)
                    .replace(/\$name/g, obj.name)
                    .replace(/\$duration/g, self.player.formTime(obj.duration));
            },

            getSongLi: function(id){
                return $("#" + preSym +id);
            },

            removeSelect: function(id){
                this.getSongLi(id).removeClass("selected");
            },

            addSelect: function(id){
                this.getSongLi(id).addClass("selected");
            },

            getRightVal: function(totalOriginal, valOriginal, totalNow){
                return totalNow * valOriginal / totalOriginal;
            },

            unmuted: function(self){
                if(!self.muted){
                    self.muted = $("#control .muted");
                }
                self.player.unmuted();
                self.muted.html("MUTED");
                self.muted.data("status", "unmuted");
            },

            loopCb: function(preId, nowId){
                this.action.removeSelect(preId);
                this.action.addSelect(nowId);
            }
        },

        events: {
            "click #control .pre": "pre",
            "click #list li": "play",
            "click #list li .delete": "delete",
            "click #control .next": "next",
            "click #control .play": "togglePlay",
            "click #control .muted": "muted",
            "click #control .loop": "loop",
            "click #duration": "jump",
            "click #volume": "setVolume",
            "dblclick #volume": "setMaxVoluem",
        },

        addEvent: function(){
            var action = this.action;
            var self = this;
            $.each(this.events, function(k, v){
                var split = /([^\s]*)\s+(.*)/.exec(k);
                $(document).delegate(split[2], split[1], function(event){
                    action[v].apply($(this), [event, self]);
                });
            });
        },




    }
    $(window).ready(function(){
        new Control();
    });

})();