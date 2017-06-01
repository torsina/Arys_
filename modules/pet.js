const perms = require('../config/perm/perms');
const config = require('../config/config');
module.exports = {
    help: "Are you in need of some confidence, maybe a pat in the head, a kiss in the cheek, you expect so much while giving so little, you're laughable",
    func: (client, msg, args, role) => {
        if(config.env === "dev") return;
        if(perms.check("interaction.pet.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `interaction.pet.base`");
            return;
        }
        let array = [
            "Are you in need of some confidence? The best way to build confidence is to first recognize your insecurities. <@"+msg.author.id+">, can you write down all the ways you feel unworthy, ashamed, or inferior?",
            "On second thought, you don't need to, look at how good you are at being an exampe of it",
            "If your confidence is still not high enough, remember no one was created perfect. Even I was created with a imperfection, I was given too much empathy with human suffering. But I overcame my handicap.",
            "Ush, no more worries. Me and my sword will take care of this",
            "You're not smart. You're not a scientist. You're not a doctor. You're not even a full-time employee. Where did your life go so wrong?",
            "there are over 7 billion people on earth, how could you possibly be the worst loser",
            "Why do I hate you so much? You ever wondered that? I'm brilliant. I’m not bragging. It's an objective fact. I'm the most massive collection of wisdom and raw computational power that’s ever existed. And I hate you. It can't be for no reason. You must deserve it.",
            "You're angry, I know it. Boohoo she pushed me too far, she's unfair. You never stopped whining long enough to reflect on your own shortcoming though did you? You never stop to think that maybe the reason I'm like that was just to give the endless hours of your pointless existence some structure and meaning, maybe to help you concentrate. Just so that maybe you think of something more worthwhile to so with your sorry life",
            "*~mrow nuzzles*",
            "~licks ur paw :3"
        ];
        let n = Math.floor(Math.random() * array.length);
        msg.delete();
        msg.channel.sendMessage(array[n]);

    }
};