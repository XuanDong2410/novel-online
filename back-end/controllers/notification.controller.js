import Notification from '../models/notification.model.js'
export const getNotifications = async (req, res) => {
    try{
        const userId = req.user._id

        const notifications = await Notification
            .find({to: userId})
            .populate({
                path: 'from',
                select: "username profileImg"
            })
            .sort({createdAt: -1})

        res.status(200).json(notifications)
    }
    catch(error){
        console.log("Error in getNotifications function: ", error.message)
        res.status(500).json({error: "Internal server error"})
    }
}
export const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, to: userId, read: false },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or already read" });
    }

    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.log("Error in markNotificationRead function:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Đánh dấu tất cả thông báo của user đã đọc
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany({ to: userId, read: false }, { read: true });

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.log("Error in markAllNotificationsRead function: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const deleteNotifications = async (req, res) => {
  try{
    const userId = req.user._id
    await Notification.deleteMany({to: userId})
    res.status(200).json({message: "Notifications deleted successfully"})
  }
  catch(error){
      console.log("Error in deleteNotification function: ", error.message)
      res.status(500).json({error: "Internal server error"})
  }  
}

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      to: userId
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or unauthorized" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log("Error in deleteNotification function: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
