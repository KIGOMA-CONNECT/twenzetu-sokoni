@@
-      userRepo.findById.mockResolvedValue(buildUser());
-      const result = await service.suspend('11111111-1111-1111-1111-111111111111');
+      userRepo.findById.mockResolvedValue(buildUser());
+      const result = await service.suspend('11111111-1111-1111-1111-111111111111', {});
       expect(sessionService.revokeAllForUser).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
       expect(result.status).toBe('SUSPENDED');
*** End Patch
