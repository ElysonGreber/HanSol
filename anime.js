// use a script tag or an external JS file
document.addEventListener("DOMContentLoaded", (event) => {
    gsap.registerPlugin(DrawSVGPlugin, EaselPlugin, MorphSVGPlugin, CustomEase, CustomBounce)
    var duration = 3;

    // timelines individuais
    var tl = gsap.timeline({ delay: 0.2 });
    var tl2 = gsap.timeline({ delay: 0.3 });
    var tl3 = gsap.timeline({ delay: 0.2 });

    // Timeline master
    var tx = gsap.timeline();

    //strength entre 0 e 1
    CustomBounce.create("myBounce", {
        strength: 0.7,
        squash: 3
    });

    // animações place1
    tl.to("#place1", {
            y: 200,
            duration: duration,
            ease: "myBounce"
        })
        .to("#place1", {
            scaleY: 0.5,
            duration: duration,
            scaleX: 1.3,
            ease: "myBounce-squash",
            transformOrigin: "bottom"
        }, 0);

    // animações place2
    tl2.to("#place2", {
            y: 100,
            duration: duration,
            ease: "myBounce"
        })
        .to("#place2", {
            scaleY: 0.5,
            duration: duration,
            scaleX: 1.3,
            ease: "myBounce-squash",
            transformOrigin: "bottom"
        }, 0);

    // animações place3
    tl3.to("#place3", {
            y: 150,
            duration: duration,
            ease: "myBounce"
        })
        .to("#place3", {
            scaleY: 0.5,
            duration: duration,
            scaleX: 1.3,
            ease: "myBounce-squash",
            transformOrigin: "bottom"
        }, 0);

    // adiciona todas dentro da master timeline
    tx.add(tl, 0)
        .add(tl2, 0)
        .add(tl3, 0);

    // anima automaticamente ao carregar
    tx.play();

})