var forbidden_error = require('../errors/forbidden_error');
var utils = require('./utils');
var deviceManager = require('../resource_managers/device_manager');
var async = require('async');

var checkAccess = function(perm, req, res, next){
	//Admin Check
	var isAdmin = utils.isAdmin(req.user);
    if(isAdmin){
        return next();
    }

    //Owner Check
	if(String(req.user._id) === String(req.device.owner._id)){
		return next();
	}

	// If the user is device's own token, allow access
	if(req.user.username){
		if(req.user.username === String(req.device._id)){
			return next();
		}
	}

	//User's ACL Check
	deviceManager.getAclByDeviceAndEntity(req.device._id, req.user._id, function(err, result){
		if( result != null && result.perm >= perm){
			return next();
		}
		
		var groupIDs = [];
		var groups = req.user.groups;

		if(!groups){
			return next(forbidden_error);
		}

		groups.forEach(function(group){
			groupIDs.push(group.group_id);
		})

		if(groupIDs.length == 0){
			return next(forbidden_error);
		}

		deviceManager.getAclByDeviceAndGroups(req.device._id, groupIDs, function(err, results){
			if(!results || results.length == 0){
				return next(forbidden_error);
			}

			for(var i =0 ; i < results.length; i++ ){
				if(results[i].perm >= perm){
					return next();
				}
			}
			return next(forbidden_error);
		})		
	})

}

exports.checkWriteAccess = function(req, res, next){
	checkAccess( 2, req, res, next);
}

exports.checkExecuteAccess = function(req, res, next){
	checkAccess( 1, req, res, next);
	
}

exports.checkAclReadAccess = function(req, res, next){
	exports.checkWriteAccess(req, res, next);
}

module.exports = exports;
