/*
 * 支持格式：[04:14.40]看到我的全心全意
 */
(function(){
    function Lrc(lrc, lrcCanvas, currentClass){
        this.lrc = lrc;
        this.lrcCanvas = lrcCanvas;
        this.currentClass = currentClass;
        this.lrcText = null;
        this.lrcList = [];
        this.currentLrcIndex = -1;
        this.top = 0;
        this.hasLrcCanvas = this.lrcCanvas.get(0);

        this.init();
    }

    Lrc.prototype = {
        constructor: Lrc,

        init: function(){
            var self = this;
            var reader = new FileReader();
            reader.readAsText(this.lrc.src, "gb2312");
            reader.onload = function(){
                self.lrcText = reader.result;
                self.txt2list(self.lrcText);

                if(self.hasLrcCanvas){
                    self.array2html();
                    self.lrcCanvas = $("ul", self.lrcCanvas);
                    self.top = parseInt(self.lrcCanvas.css("marginTop"));
                }
            }
            reader.onerror = function(){
                self.lrcText = "error";
                this.lrcCanvas && this.lrcCanvas.html('<span style="color:#FFF">no-lrc</span>');
            }
        },

        play: function(currentTime){
            if(this.lrcList.length === 0){
                return;
            }
            // currentTime = currentTime - 0.5 < 0 ? 0 : currentTime - 0.5;
            var index = this.currentLrcIndex;
            var lrc = this.getCurrentLrc(currentTime);

            if(index != this.currentLrcIndex){
                console.log(lrc);

                if(this.hasLrcCanvas){
                    this.top -= 20 * (this.currentLrcIndex - index);
                    this.lrcCanvas.css({"marginTop": this.top + "px"});
                    $("#lrc_" + index).removeClass(this.currentClass);
                    $("#lrc_" + this.currentLrcIndex).addClass(this.currentClass);   
                }
            }
        },

        txt2list: function(txt){
            var self = this;
            var lrcList = txt.split("\n");
            lrcList.forEach(function(v, i){
                v = v.trim();
                if(/^\[[\d\:\.]*?\]/.test(v)){
                    var result = /^\[([\d\:\.]*?)\](.*)/.exec(v);
                    var time = self.transTime(result[1]);
                    var content = result[2];
                    if(content.length > 0){
                        self.lrcList.push({time: time, content: content});   
                    }
                }
            });
        },

        transTime: function(time){
            time = time.trim();
            time = time.split(":").reverse();
            var digitTime = 0;

            time.forEach(function(v, i){
                digitTime += v * Math.pow(60, i);
            })

            return digitTime;
        },

        // 获取当前的歌词
        getCurrentLrc: function(currentTime){
            var index = this.currentLrcIndex;

            if(index == -1){
                this.currentLrcIndex = index = 0;
            } else if(index === this.lrcList.length - 1){
                index = this.lrcList.length - 2;
            }
            var next2Index = index + 2 > this.lrcList.length - 1 ? index + 1 : index + 2;

            var lrc = this.lrcList[index];
            var preLrc = this.lrcList[index ? index - 1 : 0];
            var nextLrc = this.lrcList[index + 1];
            var next2Lrc = this.lrcList[next2Index];

            if(currentTime >= lrc.time && currentTime < nextLrc.time){
                return lrc.content;
            } else if(currentTime < lrc.time && (lrc === preLrc || currentTime >= preLrc.time)){
                return lrc.content;
            } else if(currentTime >= nextLrc.time && (next2Lrc === nextLrc || currentTime < next2Lrc.time)){
                this.currentLrcIndex = index + 1;
                return nextLrc.content;
            } else{
                index = 0;
                for(var i = 0; i < this.lrcList.length - 1; i++){
                    if(currentTime >= this.lrcList[i].time){
                        index = i;
                    } else{
                        break;
                    }
                }
                this.currentLrcIndex = index;
                return this.lrcList[index].content;
            }

        },

        array2html: function(){
            var result = ["<ul>"];
            this.lrcList.forEach(function(v, i){
                result.push("<li id='lrc_" + i + "'>" + v.content + "</li>");
            });
            result.push("</ul>");

            $(this.lrcCanvas).html(result.join(""));
        }
    }

    window.Lrc = Lrc;
})()
