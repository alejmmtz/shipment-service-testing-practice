import { ShipmentsService } from "./shipments.service";
import { ShipmentEntity } from "./entities/shipment.entity";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ShipmentRulesService } from "./shipment-rules.service";
import { NotFoundException } from "@nestjs/common";
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { ShipmentStatus } from "./shipment-status.enum";

describe("ShipmentsServiceTest", () => {
  let service: ShipmentsService;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn<Promise<ShipmentEntity | null>, [options: any]>(),
  };

  const shipmentRulesServiceMock = {
    ensureCanBeDispatched: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(ShipmentEntity),
          useValue: repositoryMock,
        },
        {
          provide: ShipmentRulesService,
          useValue: shipmentRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ShipmentsService);
  });

  // Case 1
  it("is defined", () => {
    // Arrange was made in a beforeEach

    // Act & Assert
    expect(service).toBeDefined();
  });

  // Case 2
  it("returns all shipments", async () => {
    // Arrange
    const ShimpentsMock = [
      {
        id: 7,
        trackingCode: "12345",
        destination: "Florida",
        status: ShipmentStatus.CREATED,
      },
      {
        id: 8,
        trackingCode: "54321",
        destination: "California",
        status: ShipmentStatus.CREATED,
      },
    ] as ShipmentEntity[];

    repositoryMock.find.mockResolvedValue(ShimpentsMock);

    // Act
    const result = await service.findAll();

    // Assert
    expect(result).toBe(ShimpentsMock);
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  // Case 3
  it("returns a shipment when the id exists", async () => {
    // Arrange
    const ShipmentMock = {
      id: 7,
      trackingCode: "12345",
      destination: "Florida",
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    repositoryMock.findOneBy.mockResolvedValue(ShipmentMock);

    // Act
    const result = await service.findOne(7);

    // Assert
    expect(result).toEqual(ShipmentMock);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({
      id: 7,
    });
  });

  // Case 4
  it("throws NotFoundException when the id does not exist", async () => {
    // Arrange
    repositoryMock.findOneBy.mockResolvedValue(null);

    // Act and Assert
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Case 5
  it("creates and saves a shipment", async () => {
    // Arrange
    const ShipmentDTOMock = {
      trackingCode: "SHIP-100",
      destination: "Cali",
    } as CreateShipmentDto;

    const CreatedShipment = {
      ...ShipmentDTOMock,
      status: ShipmentStatus.CREATED,
    };

    const SavedShipment = {
      id: 1,
      ...ShipmentDTOMock,
      status: ShipmentStatus.CREATED,
    };

    repositoryMock.create.mockReturnValue(CreatedShipment);
    repositoryMock.save.mockResolvedValue(SavedShipment);

    // Act
    const result = await service.create(ShipmentDTOMock);

    // Assert
    expect(repositoryMock.create).toHaveBeenCalledWith({
      ...ShipmentDTOMock,
      status: ShipmentStatus.CREATED,
    });

    expect(result).toEqual(
      expect.objectContaining({ status: ShipmentStatus.CREATED }),
    );

    expect(repositoryMock.save).toHaveBeenCalledWith(CreatedShipment);

    expect(result).toEqual(SavedShipment);
  });

  // Case 6
  it("dispatches and saves a valid shipment", async () => {
    // Arrange
    const ShipmentMock = {
      id: 7,
      trackingCode: "12345",
      destination: "Florida",
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    const DispatchedShipmentMock = {
      ...ShipmentMock,
      status: ShipmentStatus.DISPATCHED,
    } as ShipmentEntity;

    repositoryMock.findOneBy.mockResolvedValue(ShipmentMock);
    repositoryMock.save.mockResolvedValue(DispatchedShipmentMock);

    // Act
    const result = await service.dispatch(7);

    // Assert
    await expect(
      shipmentRulesServiceMock.ensureCanBeDispatched,
    ).toHaveBeenCalledWith(ShipmentMock);

    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        status: ShipmentStatus.DISPATCHED,
      }),
    );

    expect(result).toBe(DispatchedShipmentMock);
  });
});
