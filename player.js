(function(){
    function Player(op){
        this.player = new Audio();
        this.count = 0;
        this.playList = [];
        this.lrcList = [];
        this.endCb = null;
        this.volume = 75;
        this.currentId = null;

        this.lrcCanvas = op.lrcCanvas;
        this.currentClass = op.currentClass || "cur";
        this.lrc = null;

        this.init();
    }

    Player.prototype = {
        constructor: Player,

        init: function(){
            this.setVolume(this.volume);
        },

        play: function(id){
            this.player.play();

            if(id){
                this.currentId = id;
                !this.lrc && this.loadLrcBySongId(id);
            } else{
                var index = this.findSong(this.player.src, "src");
                if(index != -1){
                    this.currentId = this.playList[index].id;
                    this.loadLrc(this.playList[index]);
                }
            }
        },

        pause: function(){
            this.player.pause();
            // this.lrc && this.lrc.pause();
        },

        stop: function(){
            this.jump(0);
            this.pause();
        },

        // 持续时间
        getDuration: function(){
            return this.player.duration;
        },

        // 播放进度
        getProgress: function(){
            return this.player.currentTime;
        },

        getFormDuration: function(){
            return this.formTime(this.getDuration());
        },

        getFormProgress: function(){
            return this.formTime(this.getProgress());
        },

        // 跳转
        jump: function(num){
            num = +num;
            if(isNaN(num)){
                return;
            }
            this.player.currentTime = num;
        },

        getVolume: function(){
            return this.player.volume * 100;
        },

        // 音量控制
        setVolume: function(num){
            num = +num;
            if(isNaN(num)){
                return;
            }

            if(+num <= 0){
                this.muted;
                num = 0;
            } else if(+num >= 100){
                this.player.volume = 1;
                num = 100;
            } else{
                this.player.volume = num / 100;
            }

            this.volume = num; 
        },

        // 静音
        muted: function(){
            this.player.muted = true;
        },

        unmuted: function(){
            this.player.muted = false;
        },

        // 循环
        loop: function(){
            this.player.loop = true;
        },

        unloop: function(){
            this.player.loop = false;
        },

        randomPlay: function(cb){
            var self = this;
            var length = this.playList.length;
            if(!length){
                return;
            }
            this.player.loop = false;

            this.ended(function(){
                var preId = self.currentId;
                var index = Math.floor(Math.random() * length);
                self.playSong(self.playList[index]);
                var nowId = self.currentId;

                cb && cb(preId, nowId);
            });
        },

        orderPlay: function(cb){
            var self = this;
            this.player.loop = false;

            this.ended(function(){
                var preId = self.currentId;
                self.playNext();
                var nowId = self.currentId;

                cb && cb(preId, nowId);
            });
        },

        loopPlay: function(){
            this.endCb && this.player.removeEventListener("ended", this.endCb);
            this.player.loop = true;
        },

        // 文件选择
        chooseFile: function(event, cb){
            var self = this;
            var list = Array.prototype.slice.call(event.target.files);
            var src;
            var count = 0;

            for(var i = list.length -1; i >= 0; i--){
                var v = list[i];

                if(v.type !== "audio/mp3"){
                    list.splice(i, 1);
                    if(/.*\.lrc$/.test(v.name)){
                        this.lrcList.push({
                            src: v,
                            name: /(.*)\./.exec(v.name)[1].trim()
                        });
                    }
                    continue;
                }

                (function(v){
                    var audio = new Audio();
                    src = window.webkitURL.createObjectURL(v);
                    audio.src = src;

                    v.src = src;
                    v.id = ++self.count;

                    audio.addEventListener("loadedmetadata", function(){
                        count++;
                        v.duration = audio.duration;

                        if(count === list.length){
                            cb(list);
                        }
                    });
                })(v);
            }

            this.playList = this.playList.concat(list);

            if(this.currentId && !this.lrc){
                this.loadLrcBySongId(this.currentId);
            }
        },

        findSong: function(val, name){
            if(!name){
                name = "id";
            }
            var index = -1;
            this.playList.forEach(function(v, i){
                if(v[name] == val){
                    index = i;
                    return index;
                }
            })

            return index;
        },

        findLrc: function(name){
            name = name.trim();
            var index = -1;
            this.lrcList.forEach(function(v, i){
                if(v.name == name || v.name.indexOf(name) != -1 || name.indexOf(v.name) != -1){
                    index = i;
                    return index;
                }
            });

            return index;
        },

        loadLrc: function(file){
            var name = this.getSongName(file.name);
            var lrcIndex = this.findLrc(name);
            if(lrcIndex != -1){
                this.lrc = new Lrc(this.lrcList[lrcIndex], this.lrcCanvas, this.currentClass);
            } else{
                this.lrc = null;
                this.lrcCanvas && this.lrcCanvas.html('<span style="color:#FFF">no-lrc</span>');
            }
        },

        loadLrcBySongId: function(id){
            var index = this.findSong(id);
            var song = this.playList[index];
            this.loadLrc(song);
        },

        deleteSong: function(id){
            var index = this.findSong(id);
            this.playList.splice(index, 1);
        },

        getSongName: function(name){
            if(/.*\./.test(name)){
                return /(.*)\./.exec(name)[1];
            }
        },

        // 播放歌曲
        loadSong: function(file){
            this.player.src = file.src;
            this.setVolume(this.volume);

            // 载入歌词
            this.loadLrc(file);
        },

        playSong: function(file){
            this.loadSong(file);
            this.play();
            this.currentId = file.id;
        },

        playSongById: function(id){
            var index = this.findSong(id);
            if(index == -1){
                return;
            }

            var song = this.playList[index];
            this.playSong(song);
        },

        // 前一首
        playPre: function(){
            if(!this.currentId){
                return;
            }

            var index = this.findSong(this.currentId);
            if(index == -1){
                return;
            }

            var preIndex = index == 0 ? this.playList.length - 1 : index - 1;
            this.playSong(this.playList[preIndex]);

            return preIndex;
        },

        // 下一首
        playNext: function(){
            if(!this.currentId){
                return;
            }

            var index = this.findSong(this.currentId);
            if(index == -1){
                return;
            }

            var nextIndex = index == this.playList.length - 1 ? 0 : index + 1;
            this.playSong(this.playList[nextIndex]);

            return nextIndex;
        },

        //格式转换
        formNum: function(num){
            return num < 10 ? "0" + num : num;
        },

        formTime: function(num){
            num = parseInt(num);
            if(isNaN(num)){
                return "00:00";
            }

            var second = num % 60; 
            var minute = (num - second) / 60;

            return this.formNum(minute) + ":" + this.formNum(second);
        },

        ended: function(cb){
            if(this.endCb){
                this.player.removeEventListener("ended", this.endCb);
            }

            this.endCb = cb;
            this.player.addEventListener("ended", cb);
        },

        addPlayEvent: function(cb){
            var self = this;
            this.player.addEventListener("timeupdate", function(){
                cb.apply(self, arguments);

                // 歌词
                self.lrc && self.player.currentTime && self.lrc.play(self.player.currentTime);
            });
        }

    }

    window.player = function(op){
        return new Player(op);
    };
})();
