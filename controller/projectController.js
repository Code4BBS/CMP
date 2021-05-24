const Project = require("../model/projectModel");
const Tag = require("./../model/tagModel");
const User = require("./../model/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ blacklisted: false })
    .populate({
      path: "tags",
      model: "Tag",
      select: "name ",
    })
    .populate({ path: "owner", model: "User", select: "name image" })
    .populate({ path: "collaborators", model: "User", select: "name image" });

  res.status(200).json({
    status: "success",
    data: {
      res: projects.length,
      projects,
    },
  });
});

const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate({
      path: "tags",
      model: "Tag",
      select: "name ",
    })
    .populate({ path: "owner", model: "User", select: "name image" })
    .populate({ path: "collaborators", model: "User", select: "name image" })
    .populate({
      path: "requests",
      populate: {
        path: "requester",
        model: "User",
        select: "name image",
      },
    });

  if (!project) return next(new AppError("Project not found", 404));

  res.status(200).json({
    status: "success",
    data: {
      project,
    },
  });
});

const createProject = catchAsync(async (req, res, next) => {
  const owner = req.user.id;
  if (!owner) return next(new AppError("No user Found", 500));

  const {
    title,
    description,
    preRequisite,
    communication,
    duration,
    tags,
    collaborators,
  } = req.body;
  console.log(tags);
  if (!title || !description || !communication)
    return next(new AppError("All Required Fields not there", 400));
  let createdAt = Date.now();

  const newProject = await Project.create({
    title,
    description,
    tags,
    preRequisite,
    communication,
    owner,
    duration,
    collaborators,
    createdAt,
  });
  const message = `Project ${title} requirements are matching your profile`;
  let notification = {
    message: message,
    projectId: newProject._id,
  };
  let projectOwners = collaborators;
  projectOwners.push(owner);

  const updatedUsers = await User.updateMany(
    {
      _id: { $nin: projectOwners },
      tags: { $all: tags },
    },
    { $push: { notifications: notification }, notificationsSeen: false }
  );

  res.status(201).json({
    status: "success",
    message: "Project created successfully",
    project: newProject,
    // updatedUsers,
  });
});

const updateProject = catchAsync(async (req, res, next) => {
  // const updateBody = {
  //   title: req.body.title,
  //   description: req.body.description,
  //   preRequsite: req.body.preRequsite,
  //   communication: req.body.communication,
  //   lastUpdatedAt: new Date(),
  // };

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { ...req.body, lastUpdatedAt: new Date() },
    {
      new: true,
      runValidators: true,
    }
  ).populate({ path: "owner", model: "User", select: "name" });

  if (!project) return next(new AppError("Project cannot be updated", 500));

  res.status(200).json({
    status: "success",
    message: "Project updated successfully",
    project: project,
  });
  console.log("reached");
});

const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) return next(new AppError("Project not found", 404));

  res.status(204).json({
    status: "success",
    message: "Project deleted successfully",
  });
});

const blacklistProject = catchAsync(async (req, res, next) => {
  console.log(req.params.id);

  const project = await Project.findByIdAndUpdate(req.params.id, {
    blacklisted: true,
  });

  if (!project) return next(new AppError("Project not found", 404));

  res.status(200).json({
    status: "success",
    message: "Project blacklisted successfully",
  });
});

const whitelistProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(req.params.id, {
    blacklisted: false,
  });

  if (!project) return next(new AppError("Project not found", 404));

  res.status(200).json({
    status: "success",
    message: "Project whitelisted successfully",
  });
});

const getAllBlacklistedProjects = async (req, res, next) => {
  const projects = await Project.find({ blacklisted: false })
    .populate({
      path: "tags",
      model: "Tag",
      select: "name ",
    })
    .populate({ path: "owner", model: "User", select: "name image" });

  res.status(200).json({
    status: "success",
    data: {
      res: projects.length,
      projects,
    },
  });
};

const requestToJoin = catchAsync(async (req, res, next) => {
  const { request } = req.body;
  // console.log(request);
  // console.log(req.user);

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { requests: request } },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedProject) return next(new AppError("Project not found", 404));

  const message = `${req.user.name} has requested to join your Project ${updatedProject.title}`;
  let notification = {
    message: message,
    projectId: updatedProject._id,
  };

  const updatedOwner = await User.findByIdAndUpdate(updatedProject.owner, {
    $push: { notifications: notification },
    notificationsSeen: false,
  });

  if (!updatedOwner) return next(new AppError("Owner not present", 500));

  res.status(200).json({
    status: "success",
    message: "Project updated successfully",
    data: { project: updatedProject },
  });
});

const acceptRequest = catchAsync(async (req, res, next) => {
  const requesterId = req.query.id;
  // console.log(requesterId);

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { requests: { requester: requesterId } },
      $push: { collaborators: requesterId },
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate({
      path: "tags",
      model: "Tag",
      select: "name ",
    })
    .populate({ path: "owner", model: "User", select: "name image" })
    .populate({ path: "collaborators", model: "User", select: "name image" })
    .populate({
      path: "requests",
      populate: {
        path: "requester",
        model: "User",
        select: "name image",
      },
    });

  if (!project) return next(new AppError("Project not found", 404));

  const message = `Your request for joining Project: ${project.title} is accpeted by project owner`;
  let notification = {
    message: message,
    projectId: project._id,
  };

  const updateUser = await User.findByIdAndUpdate(requesterId, {
    $push: { notifications: notification },
    notificationsSeen: false,
  });

  if (!updateUser) return next(new AppError("The user is absent !", 404));

  res.status(200).json({
    status: "success",
    message: "Request Updated successfully",
    data: { project },
  });
});

const rejectRequest = catchAsync(async (req, res, next) => {
  const requesterId = req.query.id;

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { requests: { requester: requesterId } },
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate({
      path: "tags",
      model: "Tag",
      select: "name ",
    })
    .populate({ path: "owner", model: "User", select: "name image" })
    .populate({ path: "collaborators", model: "User", select: "name image" })
    .populate({
      path: "requests",
      populate: {
        path: "requester",
        model: "User",
        select: "name image",
      },
    });

  if (!project) return next(new AppError("Project not found", 404));

  const message = `Your request for joining Project: ${project.title} is rejected by project owner`;
  let notification = {
    message: message,
    projectId: project._id,
  };

  const updateUser = await User.findByIdAndUpdate(requesterId, {
    $push: { notifications: notification },
    notificationsSeen: false,
  });

  if (!updateUser) return next(new AppError("The user is absent !", 404));

  res.status(200).json({
    status: "success",
    message: "Request Updated successfully",
    data: { project },
  });
});

const getAllProjectsOfAUser = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const projects = await Project.find({
    $or: [{ owner: userId }, { collaborators: { $in: [userId] } }],
  })
    .populate({
      path: "tags",
      model: "Tag",
      select: "name ",
    })
    .populate({ path: "owner", model: "User", select: "name image" })
    .populate({ path: "collaborators", model: "User", select: "name image" });

  // console.log(projects);

  res.status(200).json({
    status: "success",
    data: { res: projects.length, projects },
  });
});

module.exports = {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  whitelistProject,
  blacklistProject,
  getAllBlacklistedProjects,
  requestToJoin,
  acceptRequest,
  rejectRequest,
  getAllProjectsOfAUser,
};
