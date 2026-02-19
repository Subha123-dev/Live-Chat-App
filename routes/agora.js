const express = require("express");
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const appId = "cf371ea1d0a8439fb4febe4938acf5ff";
const appCertificate = "40b7569ef0944dcf93862e5999780a58";

router.get("/token", (req, res) => {
  try {
    const channelName = req.query.channel;

    if (!channelName) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    const uid = Math.floor(Math.random() * 100000);
    const role = RtcRole.PUBLISHER;

    const expireTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expireTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );

    return res.json({ token, uid });

  } catch (error) {
    console.error("Agora Token Error:", error);
    return res.status(500).json({ message: "Failed to generate token" });
  }
});

module.exports = router;
